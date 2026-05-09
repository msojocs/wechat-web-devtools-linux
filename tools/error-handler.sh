#!/bin/bash

devtools_fail() {
    if declare -F fail >/dev/null; then
        fail "$1"
    else
        echo -e "\033[41;37m 失败 \033[0m $1"
    fi
}

devtools_resolve_path() {
    local file_path=$1
    local file_dir

    if [[ -z "$file_path" ]]; then
        file_path=$0
    fi

    if [[ "$file_path" != /* ]]; then
        file_dir=$(cd "$(dirname "$file_path")" 2>/dev/null && pwd -P) || file_dir=""
        if [[ -n "$file_dir" ]]; then
            file_path="$file_dir/$(basename "$file_path")"
        fi
    fi

    printf "%s" "$file_path"
}

devtools_error_handler() {
    local exit_code=$1
    local line_no=$2
    local command=$3
    local file_path
    file_path=$(devtools_resolve_path "$4")

    if [[ "${DEVTOOLS_SUPPRESS_CHILD_SCRIPT_ERROR:-}" == "true" && "$command" == *.sh* ]]; then
        exit "$exit_code"
    fi

    devtools_fail "\033[31m${file_path}:${line_no}\ncommand: ${command}\nstep: ${CURRENT_STEP:-unknown}\033[0m"
    exit "$exit_code"
}

devtools_enable_error_trap() {
    set -E
    trap '{ devtools_exit_code="$?"; devtools_command="$BASH_COMMAND"; set +x; } 2>/dev/null; devtools_error_handler "$devtools_exit_code" "$LINENO" "$devtools_command" "${BASH_SOURCE[0]}"' ERR
}
