export enum RulesetType {
  Surge = 0,
  QuanX = 1,
  ClashDomain = 2,
  ClashIPCIDR = 3,
  ClashClassical = 4,
}

export class RulesetConfig {
  group = '';
  url = '';
  interval = 0;

  constructor(group = '', url = '', interval = 0) {
    this.group = group;
    this.url = url;
    this.interval = interval;
  }
}
