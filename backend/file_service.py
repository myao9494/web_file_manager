#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
file_service.py

フォルダ／ファイル取得処理をまとめたモジュール

※ .view_ignore の代わりに VIEW_IGNORE_PATTERNS で無視パターンを定義しています。
   高速な検索（Everything に近い感覚）を意識して、非同期処理（asyncio と ThreadPoolExecutor）およびキャッシュ（lru_cache）を活用しています。
"""

from pathlib import Path, PureWindowsPath
import os
import re
import fnmatch
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from typing import Optional, List, Set
from pydantic import BaseModel
import platform
from urllib.parse import unquote

# 結果のフォーマット（必要に応じて項目を追加）
class FileInfo(BaseModel):
    name: str
    path: str
    relative_path: str
    depth: int
    is_dir: bool
    size: Optional[int] = None
    children_count: Optional[int] = None

# 無視パターン（.view_ignore の内容を直接記述）
VIEW_IGNORE_PATTERNS = [
    ".git/**",
    ".ipynb_checkpoints/**",
    "*.pyc",
    "__pycache__/**",
    ".env",
    ".venv",
    "env/",
    "venv/",
    ".vscode/",
    ".idea/",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "node_modules/",
    "*.tmp"
]

def compile_patterns(patterns: list) -> List:
    """
    各パターンをコンパイルし、(パターン種別, コンパイル済み正規表現) のリストとして返す。
    
    ・パターン末尾が '/**' の場合は、そのディレクトリ以下すべてにマッチする
    ・パターン末尾が '/' の場合は、ディレクトリ名にのみマッチする
    ・それ以外は、fnmatch.translate() によりファイル名用の正規表現に変換する
    """
    compiled = []
    for pattern in patterns:
        if pattern.endswith('/**'):
            compiled.append(('dir_all', re.compile(re.escape(pattern[:-3]))))
        elif pattern.endswith('/'):
            compiled.append(('dir', re.compile(r'(^|/)' + re.escape(pattern[:-1]) + r'(/|$)')))
        else:
            compiled.append(('file', re.compile(fnmatch.translate(pattern))))
    return compiled

# 予めパターンをコンパイルしておく
COMPILED_IGNORE_PATTERNS = compile_patterns(VIEW_IGNORE_PATTERNS)

def is_ignored(path: Path, project_root: Path) -> bool:
    """
    プロジェクトルートからの相対パスで無視パターンにマッチする場合、True を返す。
    """
    try:
        rel_path = str(path.relative_to(project_root))
        for pattern_type, pattern in COMPILED_IGNORE_PATTERNS:
            if pattern_type == 'dir_all':
                if pattern.search(rel_path):
                    return True
            elif pattern_type == 'dir':
                if pattern.search(rel_path):
                    return True
            elif pattern.match(rel_path):
                return True
        return False
    except Exception as e:
        logging.error(f"is_ignored でエラー: {path} - {e}")
        return False

@lru_cache(maxsize=1000)
def normalize_path(path_str: str) -> str:
    """
    パスを正規化する。Windowsのネットワークパスも適切に処理する。
    URLエンコードされたパスもデコードする。
    """
    # URLエンコードされたパスをデコード
    if '%' in path_str:
        try:
            path_str = unquote(path_str)
        except Exception as e:
            logging.error(f"URLデコードエラー: {e}")
    
    if platform.system() == 'Windows':
        # ネットワークパスの場合（\\server\share\path）
        if path_str.startswith('\\\\'): 
            return str(PureWindowsPath(path_str))
        # スラッシュをバックスラッシュに変換
        path_str = path_str.replace('/', '\\')
        # ローカルパスの場合
        return str(PureWindowsPath(path_str))
    else:
        # Unixシステムの場合はバックスラッシュをスラッシュに変換
        path_str = path_str.replace('\\', '/')
        return str(Path(path_str))

def get_file_info_cached(path_str: str, project_root: Path, current_depth: int) -> dict:
    """
    ファイル情報の取得をディスクアクセスごとにキャッシュすることで高速化を図る。
    """
    normalized_path = normalize_path(path_str)
    p = Path(normalized_path)
    try:
        # Windowsの場合、project_rootも正規化する
        normalized_root = normalize_path(str(project_root))
        project_root = Path(normalized_root)
        rel_path = str(p.relative_to(project_root))
    except ValueError:
        rel_path = p.name
    
    try:
        is_dir = p.is_dir()
        size = os.path.getsize(p) if p.is_file() else None
        children_count = len(list(p.iterdir())) if is_dir else None
    except (PermissionError, FileNotFoundError) as e:
        logging.error(f"ファイル情報取得エラー: {p} - {e}")
        is_dir = False
        size = None
        children_count = None
    
    info = {
        "name": p.name,
        "path": str(p),
        "relative_path": rel_path,
        "depth": current_depth,
        "is_dir": is_dir,
        "size": size,
        "children_count": children_count
    }
    return info

# 並列実行用スレッドプール
thread_pool = ThreadPoolExecutor(max_workers=4)

def parse_extension_filter(extensions: str) -> Optional[Set[str]]:
    """
    拡張子フィルタの文字列（例 "pptx+xlsx"）をパースし、拡張子（先頭の.は除く）のセットに変換する。
    フィルタ文字列が空の場合は None を返す。
    """
    if not extensions:
        return None
    # 小文字にして + で分割
    return { ext.lower() for ext in extensions.split('+') if ext }

async def process_item(item: Path, current_depth: int, max_depth: int, project_root: Path, ext_filter: Optional[Set[str]]) -> List[FileInfo]:
    """
    個々のアイテム（ファイルまたはディレクトリ）を処理する。
    ディレクトリの場合、max_depth まで再帰的に中身を走査する。
    ext_filter が指定されている場合、ファイルならその拡張子がフィルタに含まれるものだけを結果に含める。
    ディレクトリは常に結果に含めます。
    """
    try:
        results: List[FileInfo] = []
        # ファイルの場合、拡張子チェックを実施
        if item.is_file() and ext_filter is not None:
            # 拡張子は、先頭のドットを除去して小文字にする
            ext = item.suffix.lower().lstrip('.')
            if ext not in ext_filter:
                return []  # フィルタに合致しないなら空リストを返す

        loop = asyncio.get_running_loop()
        info = await loop.run_in_executor(
            thread_pool, 
            get_file_info_cached, 
            str(item),
            project_root,
            current_depth
        )
        file_info = FileInfo(**info)
        results.append(file_info)

        if item.is_dir() and current_depth < max_depth:
            children = await process_directory(item, current_depth + 1, max_depth, project_root, ext_filter)
            results.extend(children)
        return results
    except Exception as e:
        logging.error(f"process_item でエラー: {item} - {e}")
        return []

async def process_directory(current_path: Path, current_depth: int, max_depth: int, project_root: Path, ext_filter: Optional[Set[str]]) -> List[FileInfo]:
    """
    指定ディレクトリ内の全アイテムを、非同期に処理する。
    無視すべきアイテムは is_ignored() で除外する。
    ext_filter は process_item に渡され、ファイルの場合の拡張子チェックに利用される。
    """
    if current_depth > max_depth:
        return []
    try:
        items = [item for item in current_path.iterdir() if not is_ignored(item, project_root)]
        tasks = [process_item(item, current_depth, max_depth, project_root, ext_filter) for item in items]
        results = await asyncio.gather(*tasks)
        # ネストしたリストを平坦化する
        file_list: List[FileInfo] = [f for sublist in results for f in sublist]
        return file_list
    except Exception as e:
        logging.error(f"process_directory でエラー: {current_path} - {e}")
        return []

async def retrieve_files(root_path: Path, depth: int = 1, extensions: str = "") -> List[FileInfo]:
    """
    指定パス（ディレクトリまたはファイル）の情報を取得する。
    ・ディレクトリの場合は、その中身を depth まで再帰的に走査する。
    ・ファイルの場合は、ファイル情報のみを返す。
    extensions パラメータにフィルタ文字列（例："pptx+xlsx"）が指定されている場合、
    拡張子フィルタを適用します（ディレクトリは常に含む）。
    
    project_root には、例として root_path の親を指定しています。必要に応じ調整してください。
    """
    ext_filter = parse_extension_filter(extensions)
    project_root = root_path.parent
    if root_path.is_dir():
        return await process_directory(root_path, 1, depth, project_root, ext_filter)
    else:
        try:
            # ファイルの場合もフィルタを適用
            if root_path.is_file() and ext_filter is not None:
                ext = root_path.suffix.lower().lstrip('.')
                if ext not in ext_filter:
                    return []  # フィルタに合致しない場合は空リスト
            info = get_file_info_cached(str(root_path), project_root, 1)
            return [FileInfo(**info)]
        except Exception as e:
            logging.error(f"retrieve_files でエラー: {root_path} - {e}")
            return []
