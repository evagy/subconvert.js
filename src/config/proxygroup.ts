export enum ProxyGroupType {
  Select = 'select',
  URLTest = 'url-test',
  Fallback = 'fallback',
  LoadBalance = 'load-balance',
  Relay = 'relay',
  SSID = 'ssid',
  Smart = 'smart',
}

export class ProxyGroupConfig {
  name = '';
  type: ProxyGroupType = ProxyGroupType.Select;
  proxies: string[] = [];
  url = '';
  interval = 0;
  tolerance = 0;
  timeout = 0;
  strategy = '';

  constructor(name = '', type: ProxyGroupType = ProxyGroupType.Select) {
    this.name = name;
    this.type = type;
  }
}
