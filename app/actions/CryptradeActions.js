import alt from "alt-instance";
import {cryptradeAPIs} from "../api/apiConfig";
import {getCryptradeDefaultMarket} from "../branding";

const API_MARKET_URL = cryptradeAPIs.BASE + cryptradeAPIs.MARKETS;

let markets = {
    data: null
};
let marketsTTL = 60 * 60 * 1000; // 60 minutes

class CryptradeActions {
    getMarkets() {
        return dispatch => {
            const now = new Date();

            if (markets.lastFetched) {
                if (now - markets.lastFetched < marketsTTL) {
                    return; // we just fetched the results, no need to update...
                }
            } else {
                dispatch([getCryptradeDefaultMarket()]);
            }

            markets.lastFetched = new Date();

            fetch(API_MARKET_URL)
                .then(reply =>
                    reply.json().then(result => {
                        markets = {
                            lastFetched: new Date(),
                            data: result.filter(m => m.blacklisted !== true)
                        };

                        dispatch(markets.data);
                    })
                )
                .catch(err => {
                    markets.lastFetched = null;
                });
        };
    }
}

export default alt.createActions(CryptradeActions);
