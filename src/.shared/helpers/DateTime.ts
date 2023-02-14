const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

export class DateTime {
  public date: Date;

  constructor(date: Date) {
    dayjs.extend(utc);
    this.date = dayjs(date).utc().toDate();
  }

  static now(): DateTime {
    return new DateTime(new Date());
  }
}
