#!/usr/bin/env sh
#
# Commit mesajlarinda otomatik eklenen atif satirlarini yakalar.
#
# Bu dosya desen listesinin TEK DOGRULUK KAYNAGIDIR. Ayni desenler hook'ta,
# is akisinda ya da baska bir betikte TEKRARLANMAZ; hepsi burayi cagirir.
#
# Kullanim:
#   sh scripts/check-commit-messages.sh --message-file .git/COMMIT_EDITMSG
#   sh scripts/check-commit-messages.sh --range <taban>..<tepe>
#   sh scripts/check-commit-messages.sh --all
#
# Cikis kodlari:
#   0  temiz (ya da yalnizca uyari var ve COMMIT_MSG_STRICT ayarli degil)
#   1  en az bir ihlal bulundu
#   2  kullanim hatasi
#
# Ortam degiskenleri:
#   COMMIT_MSG_STRICT=1   Uyarilari da hataya cevirir (cikis kodu 1).
#
# Iki katmanli kural:
#   RET     Otomatik eklenen atif satirlari. Bunlar makine tarafindan uretilir,
#           serbest metinde tesadufen olusmaz; dogrudan reddedilir.
#   UYARI   Serbest metinde gecen arac adlari. Mesru olabilir (ornegin CSS
#           "cursor" ozelligi ya da "GPT bolum tablosu"), bu yuzden derlemeyi
#           kirmaz; yalnizca gorunur kilar.

set -u

# --- Kural tablosu -----------------------------------------------------------
#
# Alanlar sekme ile ayrilir:  ID <TAB> ERE deseni <TAB> aciklama <TAB> duzeltme
# Desenler POSIX ERE'dir ve buyuk/kucuk harf duyarsiz eslestirilir (grep -i).
# GNU'ya ozgu \b, \d gibi kisayollar KULLANILMAZ; betik Git Bash ve Ubuntu'da
# ayni sekilde calismalidir.

hard_rules() {
	cat <<'HARD_RULES'
R1	^[[:space:]]*co-authored-by:.*(claude|anthropic\.com|openai|chatgpt|copilot|gemini|codex|cursor\.(sh|com))	Co-Authored-By trailer'inda arac/asistan atfi	Satiri commit mesajindan tamamen kaldirin. Ortak yazar gercek bir kisiyse ad ve e-postasini elle yazin.
R2	^[[:space:]]*((claude|chatgpt|copilot|codex|cursor|gemini|assistant|agent|ai)-session:|[a-z][a-z0-9_-]*-session:[[:space:]]*(https?://|[a-z0-9_]{16,}))	Oturum kimligi trailer'i	Satiri commit mesajindan tamamen kaldirin. Oturum kimlikleri commit gecmisine ait degildir.
R3	(claude\.ai/code|chat\.openai\.com|chatgpt\.com/c/|copilot\.microsoft\.com|gemini\.google\.com/app|noreply@anthropic\.com|noreply@openai\.com)	Arac oturum URL'si veya otomatik atif e-postasi	Satiri kaldirin. Bagli bir kaynak gostermek istiyorsaniz issue ya da PR numarasi kullanin.
R4	generated[[:space:]]+(with|by)[[:space:]]+\[?(claude|chatgpt|copilot|gpt|cursor|gemini|anthropic|openai|codex)	"Generated with/by" atif kalibi	Satiri kaldirin; degisikligi kendi cumlenizle ozetleyin.
HARD_RULES
}

warn_rules() {
	cat <<'WARN_RULES'
W1	(claude|chatgpt|copilot|gpt|cursor|gemini|anthropic|openai|codex)	Serbest metinde arac adi	Kasitli degilse cikarin. Kasitliysa (ornegin bir bagimlilik adi) oldugu gibi birakabilirsiniz.
WARN_RULES
}

# --- Yardimcilar -------------------------------------------------------------

usage() {
	cat <<'USAGE'
Kullanim: sh scripts/check-commit-messages.sh <mod>

Modlar:
  --message-file <dosya>   Tek bir commit mesaj dosyasini tarar (commit-msg hook'u icin).
  --range <taban>..<tepe>  Verilen araliktaki commit'leri tarar (CI icin).
  --all                    HEAD gecmisindeki tum commit'leri tarar.

Secenekler:
  -h, --help               Bu yardimi gosterir.

Ortam:
  COMMIT_MSG_STRICT=1      Uyarilari da hataya cevirir.
USAGE
}

TMPDIR_SELF=""
cleanup() {
	[ -n "$TMPDIR_SELF" ] && [ -d "$TMPDIR_SELF" ] && rm -rf "$TMPDIR_SELF"
}
trap cleanup EXIT HUP INT TERM

TMPDIR_SELF=$(mktemp -d 2>/dev/null) || {
	echo "HATA: gecici dizin olusturulamadi." >&2
	exit 2
}

REJECTS="$TMPDIR_SELF/rejects"
WARNS="$TMPDIR_SELF/warns"
: >"$REJECTS"
: >"$WARNS"

reject_count=0
warn_count=0

# Commit mesaj dosyasini tarama icin hazirlar:
#   1) CR karakterlerini atar (CRLF checkout'larda desenler bozulmasin diye),
#   2) "scissors" satirindan sonrasini (verbose commit'teki diff) keser,
#   3) yorum satirlarini bosaltir -- silmez, boylece SATIR NUMARALARI korunur.
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

# Tek bir hazirlanmis mesaji tum kurallara karsi tarar.
#   $1 = hazirlanmis mesaj dosyasi
#   $2 = kaynak etiketi (commit ozeti, ya da hook icin bos)
scan_message() {
	_msg="$1"
	_label="$2"
	_hardlines="$TMPDIR_SELF/hardlines"
	: >"$_hardlines"

	# --- RET katmani ---
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
				printf 'RET  [%s] %s\n' "$rid" "$rdesc"
				[ -n "$_label" ] && printf '     commit : %s\n' "$_label"
				printf '     satir  : %s\n' "$_no"
				printf '     icerik : %s\n' "$_txt"
				printf '     duzelt : %s\n\n' "$rfix"
			} >>"$REJECTS"
			reject_count=$((reject_count + 1))
		done <"$TMPDIR_SELF/hits"
	done <"$TMPDIR_SELF/hr"

	# --- UYARI katmani ---
	# Zaten reddedilmis satirlar tekrar raporlanmaz.
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
				printf 'UYARI [%s] %s\n' "$wid" "$wdesc"
				[ -n "$_label" ] && printf '      commit : %s\n' "$_label"
				printf '      satir  : %s\n' "$_no"
				printf '      icerik : %s\n' "$_txt"
				printf '      duzelt : %s\n\n' "$wfix"
			} >>"$WARNS"
			warn_count=$((warn_count + 1))
		done <"$TMPDIR_SELF/whits"
	done <"$TMPDIR_SELF/wr"
}

# Bir commit araligini/listesini tarar.
scan_revs() {
	_revspec="$1"

	if ! git rev-list $_revspec >"$TMPDIR_SELF/revs" 2>"$TMPDIR_SELF/reverr"; then
		echo "HATA: commit araligi cozulemedi: $_revspec" >&2
		sed 's/^/       /' "$TMPDIR_SELF/reverr" >&2
		exit 2
	fi

	_n=$(wc -l <"$TMPDIR_SELF/revs" | tr -d ' ')
	if [ "$_n" -eq 0 ]; then
		echo "Taranacak commit yok ($_revspec)."
		return 0
	fi
	echo "Taranan commit sayisi: $_n  ($_revspec)"

	while IFS= read -r sha; do
		[ -z "$sha" ] && continue
		git log -1 --format=%B "$sha" | tr -d '\r' >"$TMPDIR_SELF/body"
		_subject=$(git log -1 --format='%h %s' "$sha")
		scan_message "$TMPDIR_SELF/body" "$_subject"
	done <"$TMPDIR_SELF/revs"
}

# --- Argumanlar --------------------------------------------------------------

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
			echo "HATA: --message-file bir dosya yolu bekler." >&2
			exit 2
		}
		mode="file"
		target="$2"
		shift 2
		;;
	--range)
		[ $# -lt 2 ] && {
			echo "HATA: --range bir <taban>..<tepe> ifadesi bekler." >&2
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
		echo "HATA: bilinmeyen arguman: $1" >&2
		usage >&2
		exit 2
		;;
	esac
done

[ -z "$mode" ] && {
	usage >&2
	exit 2
}

# --- Calistir ----------------------------------------------------------------

case "$mode" in
file)
	[ -f "$target" ] || {
		echo "HATA: mesaj dosyasi bulunamadi: $target" >&2
		exit 2
	}
	prepare_message_file "$target" "$TMPDIR_SELF/msg"
	scan_message "$TMPDIR_SELF/msg" ""
	;;
range)
	scan_revs "$target"
	;;
all)
	# HEAD gecmisi bilincli bir tercih: "git rev-list --all" yerel olarak
	# fetch edilmis ek ref'leri (ornegin refs/remotes/pr/*) de tarar ve sonuc
	# makineden makineye degisir. HEAD gecmisi herkeste ayni cikar.
	scan_revs "HEAD"
	;;
esac

# --- Rapor -------------------------------------------------------------------

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
printf 'Sonuc: %d ret, %d uyari' "$reject_count" "$warn_count"
[ "$strict" -eq 1 ] && printf '  (COMMIT_MSG_STRICT=1: uyarilar da hata sayilir)'
echo

if [ "$reject_count" -gt 0 ]; then
	echo
	echo "Commit mesajlarinda otomatik eklenen atif satirlari var."
	echo "Son commit'i duzeltmek icin:  git commit --amend"
	echo "Kurallar ve desenler:         scripts/check-commit-messages.sh"
	exit 1
fi

if [ "$warn_count" -gt 0 ] && [ "$strict" -eq 1 ]; then
	echo
	echo "COMMIT_MSG_STRICT=1 ayarli; uyarilar hata olarak degerlendirildi."
	exit 1
fi

echo "Temiz."
exit 0
