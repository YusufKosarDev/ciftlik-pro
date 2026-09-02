#!/usr/bin/env sh
#
# Catches the attribution lines that coding assistants append to commit messages.
#
# This file is the SINGLE SOURCE OF TRUTH for the pattern list. The same patterns
# are NOT repeated in a hook, a workflow or another script; all of them call here.
#
# Usage:
#   sh scripts/check-commit-messages.sh --message-file .git/COMMIT_EDITMSG
#   sh scripts/check-commit-messages.sh --range <base>..<tip>
#   sh scripts/check-commit-messages.sh --all
#
# Exit codes:
#   0  clean (or warnings only, with COMMIT_MSG_STRICT unset)
#   1  at least one violation found
#   2  usage error
#
# Environment:
#   COMMIT_MSG_STRICT=1   Turns warnings into errors too (exit code 1).
#
# Two layers of rules:
#   REJECT  Machine-generated attribution lines. They do not occur by accident in
#           prose, so they are refused outright.
#   WARN    Tool names appearing in free text. These can be legitimate (the CSS
#           "cursor" property, say, or "the GPT section table"), so they do not
#           break the build; they are only made visible.

set -u

# --- Rule table --------------------------------------------------------------
#
# Fields are tab separated:  ID <TAB> ERE pattern <TAB> description <TAB> fix
# The patterns are POSIX ERE and are matched case-insensitively (grep -i).
# GNU-specific shorthands such as \b and \d are NOT used; the script has to behave
# identically in Git Bash and on Ubuntu.

hard_rules() {
	cat <<'HARD_RULES'
R1	^[[:space:]]*co-authored-by:.*(claude|anthropic\.com|openai|chatgpt|copilot|gemini|codex|cursor\.(sh|com))	Tool or assistant attribution in a Co-Authored-By trailer	Remove the line from the commit message. If the co-author is a real person, write their name and address by hand.
R2	^[[:space:]]*((claude|chatgpt|copilot|codex|cursor|gemini|assistant|agent|ai)-session:|[a-z][a-z0-9_-]*-session:[[:space:]]*(https?://|[a-z0-9_]{16,}))	Session identifier trailer	Remove the line from the commit message. Session identifiers do not belong in the history.
R3	(claude\.ai/code|chat\.openai\.com|chatgpt\.com/c/|copilot\.microsoft\.com|gemini\.google\.com/app|noreply@anthropic\.com|noreply@openai\.com)	A tool session URL or an automated attribution address	Remove the line. To point at a related source, use an issue or PR number.
R4	generated[[:space:]]+(with|by)[[:space:]]+\[?(claude|chatgpt|copilot|gpt|cursor|gemini|anthropic|openai|codex)	The "Generated with/by" attribution pattern	Remove the line; summarise the change in your own words.
HARD_RULES
}

warn_rules() {
	cat <<'WARN_RULES'
W1	(claude|chatgpt|copilot|gpt|cursor|gemini|anthropic|openai|codex)	A tool name in free text	Remove it unless it is deliberate. If it is (a dependency name, for instance), leave it as it is.
WARN_RULES
}

# --- Helpers -----------------------------------------------------------------

usage() {
	cat <<'USAGE'
Usage: sh scripts/check-commit-messages.sh <mode>

Modes:
  --message-file <file>    Scan a single commit message file (for the commit-msg hook).
  --range <base>..<tip>    Scan the commits in the given range (for CI).
  --all                    Scan every commit in HEAD's history.

Options:
  -h, --help               Show this help.

Environment:
  COMMIT_MSG_STRICT=1      Turn warnings into errors too.
USAGE
}

TMPDIR_SELF=""
cleanup() {
	[ -n "$TMPDIR_SELF" ] && [ -d "$TMPDIR_SELF" ] && rm -rf "$TMPDIR_SELF"
}
trap cleanup EXIT HUP INT TERM

TMPDIR_SELF=$(mktemp -d 2>/dev/null) || {
	echo "ERROR: could not create a temporary directory." >&2
	exit 2
}

REJECTS="$TMPDIR_SELF/rejects"
WARNS="$TMPDIR_SELF/warns"
: >"$REJECTS"
: >"$WARNS"

reject_count=0
warn_count=0

# Prepares a commit message file for scanning:
#   1) strips CR characters, so the patterns are not broken on a CRLF checkout,
#   2) cuts everything after the scissors line (the diff in a verbose commit),
#   3) blanks comment lines -- it does not delete them, so LINE NUMBERS survive.
prepare_message_file() {
	_src="$1"
	_dst="$2"

	_cc=$(git config --get core.commentChar 2>/dev/null || true)
	[ -z "$_cc" ] && _cc='#'
	[ "$_cc" = "auto" ] && _cc='#'

	tr -d '\r' <"$_src" >"$TMPDIR_SELF/raw"

	_sc=$(grep -n "^${_cc}[[:space:]]*-\{6,\}[[:space:]]*>8[[:space:]]*-\{6,\}" "$TMPDIR_SELF/raw" 2>/dev/null | head -1 | cut -d: -f1)
	if [ -n "${_sc:-}" ] && [ "$_sc" -gt 1 ] 2>/dev/null; then
		head -n $((_sc - 1)) "$TMPDIR_SELF/raw" >"$TMPDIR_SELF/cut"
	else
		cat "$TMPDIR_SELF/raw" >"$TMPDIR_SELF/cut"
	fi

	sed "s/^${_cc}.*//" "$TMPDIR_SELF/cut" >"$_dst"
}

# Scans one prepared message against every rule.
#   $1 = the prepared message file
#   $2 = a source label (the commit subject, or empty for the hook)
scan_message() {
	_msg="$1"
	_label="$2"
	_hardlines="$TMPDIR_SELF/hardlines"
	: >"$_hardlines"

	# --- REJECT layer ---
	hard_rules >"$TMPDIR_SELF/hr"
	while IFS="$(printf '\t')" read -r rid rre rdesc rfix; do
		[ -z "${rid:-}" ] && continue
		grep -n -i -E "$rre" "$_msg" >"$TMPDIR_SELF/hits" 2>/dev/null || true
		[ -s "$TMPDIR_SELF/hits" ] || continue
		while IFS= read -r hit; do
			_no=${hit%%:*}
			_txt=${hit#*:}
			echo "$_no" >>"$_hardlines"
			{
				printf 'REJECT [%s] %s\n' "$rid" "$rdesc"
				[ -n "$_label" ] && printf '       commit : %s\n' "$_label"
				printf '       line   : %s\n' "$_no"
				printf '       text   : %s\n' "$_txt"
				printf '       fix    : %s\n\n' "$rfix"
			} >>"$REJECTS"
			reject_count=$((reject_count + 1))
		done <"$TMPDIR_SELF/hits"
	done <"$TMPDIR_SELF/hr"

	# --- WARN layer ---
	# Lines already rejected are not reported a second time.
	warn_rules >"$TMPDIR_SELF/wr"
	while IFS="$(printf '\t')" read -r wid wre wdesc wfix; do
		[ -z "${wid:-}" ] && continue
		grep -n -i -E "$wre" "$_msg" >"$TMPDIR_SELF/whits" 2>/dev/null || true
		[ -s "$TMPDIR_SELF/whits" ] || continue
		while IFS= read -r hit; do
			_no=${hit%%:*}
			_txt=${hit#*:}
			if grep -qx "$_no" "$_hardlines" 2>/dev/null; then
				continue
			fi
			{
				printf 'WARN   [%s] %s\n' "$wid" "$wdesc"
				[ -n "$_label" ] && printf '       commit : %s\n' "$_label"
				printf '       line   : %s\n' "$_no"
				printf '       text   : %s\n' "$_txt"
				printf '       fix    : %s\n\n' "$wfix"
			} >>"$WARNS"
			warn_count=$((warn_count + 1))
		done <"$TMPDIR_SELF/whits"
	done <"$TMPDIR_SELF/wr"
}

# Scans a commit range or list.
scan_revs() {
	_revspec="$1"

	if ! git rev-list $_revspec >"$TMPDIR_SELF/revs" 2>"$TMPDIR_SELF/reverr"; then
		echo "ERROR: could not resolve the commit range: $_revspec" >&2
		sed 's/^/       /' "$TMPDIR_SELF/reverr" >&2
		exit 2
	fi

	_n=$(wc -l <"$TMPDIR_SELF/revs" | tr -d ' ')
	if [ "$_n" -eq 0 ]; then
		echo "No commits to scan ($_revspec)."
		return 0
	fi
	echo "Commits scanned: $_n  ($_revspec)"

	while IFS= read -r sha; do
		[ -z "$sha" ] && continue
		git log -1 --format=%B "$sha" | tr -d '\r' >"$TMPDIR_SELF/body"
		_subject=$(git log -1 --format='%h %s' "$sha")
		scan_message "$TMPDIR_SELF/body" "$_subject"
	done <"$TMPDIR_SELF/revs"
}

# --- Arguments ---------------------------------------------------------------

mode=""
target=""

[ $# -eq 0 ] && {
	usage >&2
	exit 2
}

while [ $# -gt 0 ]; do
	case "$1" in
	--message-file)
		[ $# -lt 2 ] && {
			echo "ERROR: --message-file expects a file path." >&2
			exit 2
		}
		mode="file"
		target="$2"
		shift 2
		;;
	--range)
		[ $# -lt 2 ] && {
			echo "ERROR: --range expects a <base>..<tip> expression." >&2
			exit 2
		}
		mode="range"
		target="$2"
		shift 2
		;;
	--all)
		mode="all"
		shift
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		echo "ERROR: unknown argument: $1" >&2
		usage >&2
		exit 2
		;;
	esac
done

[ -z "$mode" ] && {
	usage >&2
	exit 2
}

# --- Run -----------------------------------------------------------------------

case "$mode" in
file)
	[ -f "$target" ] || {
		echo "ERROR: message file not found: $target" >&2
		exit 2
	}
	prepare_message_file "$target" "$TMPDIR_SELF/msg"
	scan_message "$TMPDIR_SELF/msg" ""
	;;
range)
	scan_revs "$target"
	;;
all)
	# Scanning HEAD's history is a deliberate choice: "git rev-list --all" would also
	# scan extra refs fetched locally (refs/remotes/pr/*, for instance), making the
	# result differ from machine to machine. HEAD's history is the same for everyone.
	scan_revs "HEAD"
	;;
esac

# --- Report --------------------------------------------------------------------

strict=0
[ "${COMMIT_MSG_STRICT:-0}" = "1" ] && strict=1

if [ "$warn_count" -gt 0 ]; then
	echo
	cat "$WARNS"
fi

if [ "$reject_count" -gt 0 ]; then
	echo
	cat "$REJECTS"
fi

echo "----------------------------------------------------------------"
printf 'Result: %d rejected, %d warnings' "$reject_count" "$warn_count"
[ "$strict" -eq 1 ] && printf '  (COMMIT_MSG_STRICT=1: warnings count as errors)'
echo

if [ "$reject_count" -gt 0 ]; then
	echo
	echo "The commit messages contain machine-generated attribution lines."
	echo "To fix the last commit:  git commit --amend"
	echo "Rules and patterns:      scripts/check-commit-messages.sh"
	exit 1
fi

if [ "$warn_count" -gt 0 ] && [ "$strict" -eq 1 ]; then
	echo
	echo "COMMIT_MSG_STRICT=1 is set; warnings were treated as errors."
	exit 1
fi

echo "Clean."
exit 0
