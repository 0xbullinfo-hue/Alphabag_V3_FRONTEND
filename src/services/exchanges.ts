export interface CexMetadata {
    id: string;
    name: string;
    icon: string;
}

export const SUPPORTED_CEX: CexMetadata[] = [
    { id: 'binance',  name: 'Binance',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png' },
    { id: 'bybit',    name: 'Bybit',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png' },
    { id: 'okx',      name: 'OKX',      icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png' },
    { id: 'coinbase', name: 'Coinbase', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png'  },
    { id: 'kraken',   name: 'Kraken',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png'  },
    { id: 'kucoin',   name: 'KuCoin',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/311.png' },
    { id: 'gate',     name: 'Gate.io',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/302.png' },
    { id: 'mexc',     name: 'MEXC',     icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/544.png' },
    { id: 'bitget',   name: 'Bitget',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/517.png' },
    { id: 'bingx',    name: 'BingX',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/4003.png'},
    { id: 'htx',      name: 'HTX',      icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/400.png' },
    { id: 'bitfinex', name: 'Bitfinex', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/37.png'  },
    { id: 'gemini',   name: 'Gemini',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/151.png' },
    { id: 'phemex',   name: 'Phemex',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/723.png' },
    { id: 'deribit',  name: 'Deribit',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/426.png' },
    { id: 'bitstamp', name: 'Bitstamp', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/70.png'  },
    { id: 'lbank',    name: 'LBank',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/498.png' },
    { id: 'bitcomp',  name: 'Bit.com',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1230.png'},
    { id: 'poloniex', name: 'Poloniex', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/23.png'  },
    { id: 'upbit',    name: 'Upbit',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/375.png' },
];
