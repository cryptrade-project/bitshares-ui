import {Map, OrderedMap} from "immutable";
import alt from "alt-instance";
import CryptradeActions from "actions/CryptradeActions";

class CryptradeStore {
    constructor() {
        this.markets = OrderedMap();
        this.assets = Map();
        this.news = null;

        this.bindListeners({
            onGetCryptradeMarkets: CryptradeActions.getMarkets
        });
    }

    onGetCryptradeMarkets(markets) {
        if (markets) {
            markets.map(m => {
                this.markets = this.markets.set(m.id, m);
            });
        }
    }
}

export default alt.createStore(CryptradeStore, "CryptradeStore");
