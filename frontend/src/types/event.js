export function Event(date, type, extra) {
  this.date = date; // objet Date
  this.type = type; // 'course', 'meeting', 'exam', 'other'
  Object.assign(this, extra);
}
