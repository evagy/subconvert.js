export class RegexMatchConfig {
  match: RegExp;
  replace: string;
  script = '';

  constructor(match = '', replace = '') {
    this.match = new RegExp(match);
    this.replace = replace;
  }
}
