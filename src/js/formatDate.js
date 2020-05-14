export function addZero(x) {
  return (x < 10) ? `0${x}` : x;
}

export default function formatDate(date) {
  const d = new Date(date);

  const DD = addZero(d.getDate());
  const MM = addZero(d.getMonth() + 1);
  // const YY = addZero(d.getFullYear() % 100);
  const YYYY = d.getFullYear();
  const HH = addZero(d.getHours());
  const mm = addZero(d.getMinutes());
  const ss = addZero(d.getSeconds());

  return `${DD}.${MM}.${YYYY} ${HH}:${mm}:${ss}`;
}
