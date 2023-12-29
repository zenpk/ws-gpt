class Guest {
  private readonly date: number;
  private readonly quota: number;
  private leftOver: number;

  constructor(quota: number) {
    this.date = this.localeDate();
    this.quota = quota;
    this.leftOver = quota;
  }

  public reduceLeftOver(): boolean {
    const nowDate = this.localeDate();
    if (nowDate !== this.date) {
      this.leftOver = this.quota;
    }
    if (this.leftOver > 0) {
      this.leftOver--;
      return true;
    }
    return false;
  }

  private localeDate() {
    const date = new Date();
    date.setUTCHours(date.getUTCHours() + 8);
    return date.getDate();
  }
}
