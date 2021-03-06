import React from "react";
import {Link} from "react-router-dom";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import AssetImage from "../Utility/AssetImage";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import PriceStatWithLabel from "./PriceStatWithLabel";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {ChainStore} from "bitsharesjs";
import ExchangeHeaderCollateral from "./ExchangeHeaderCollateral";
import {Icon as AntIcon} from "bitshares-ui-style-guide";
import {Asset, Price} from "common/MarketClasses";
import utils from "../../lib/common/utils";

export default class ExchangeHeader extends React.Component {
    constructor(props) {
        super();

        this.state = {
            isModalVisible: false,
            volumeShowQuote: true,
            selectedMarketPickerAsset: props.selectedMarketPickerAsset
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            selectedMarketPickerAsset: nextProps.selectedMarketPickerAsset
        });
    }

    shouldComponentUpdate(nextProps) {
        if (!nextProps.marketReady) return false;
        return true;
    }

    componentDidUpdate() {
        this._updateTitle();
    }

    _updateTitle() {
        const {quoteAsset, baseAsset, latestPrice} = this.props;

        if (latestPrice && this._quoteName && this._baseName) {
            document.title =
                utils.price_text(latestPrice, quoteAsset, baseAsset) +
                " " +
                this._quoteName +
                " / " +
                this._baseName;
        }
    }

    _addMarket(quote, base) {
        let marketID = `${quote}_${base}`;
        if (!this.props.starredMarkets.has(marketID)) {
            SettingsActions.addStarMarket(quote, base);
        } else {
            SettingsActions.removeStarMarket(quote, base);
        }
    }

    changeVolumeBase() {
        this.setState({
            volumeShowQuote: !this.state.volumeShowQuote
        });
    }

    marketPicker(asset) {
        let {selectedMarketPickerAsset} = this.state;

        selectedMarketPickerAsset =
            !!selectedMarketPickerAsset && selectedMarketPickerAsset == asset
                ? null
                : asset;

        this.setState({
            selectedMarketPickerAsset
        });
        this.props.onToggleMarketPicker(selectedMarketPickerAsset);
    }

    render() {
        const {
            quoteAsset,
            baseAsset,
            starredMarkets,
            hasPrediction,
            feedPrice,
            showCallLimit,
            lowestCallPrice,
            marketReady,
            latestPrice,
            marketStats,
            account
        } = this.props;

        const baseSymbol = baseAsset.get("symbol");
        const quoteSymbol = quoteAsset.get("symbol");

        // Favorite star
        const marketID = `${quoteSymbol}_${baseSymbol}`;
        const starClass = starredMarkets.has(marketID)
            ? "gold-star"
            : "grey-star";

        // Market stats
        const dayChange = marketStats.get("change");

        const dayChangeClass =
            parseFloat(dayChange) === 0
                ? ""
                : parseFloat(dayChange) < 0
                    ? "negative"
                    : "positive";
        const volumeBase = marketStats.get("volumeBase");
        const volumeQuote = marketStats.get("volumeQuote");
        const dayChangeWithSign = dayChange > 0 ? "+" + dayChange : dayChange;

        let showCollateralRatio = false;

        const quoteId = quoteAsset.get("id");
        const baseId = baseAsset.get("id");

        const lookForBitAsset =
            quoteId === "1.3.0" ? baseId : baseId === "1.3.0" ? quoteId : null;
        const possibleBitAsset = lookForBitAsset
            ? ChainStore.getAsset(lookForBitAsset)
            : null;
        const isBitAsset = possibleBitAsset
            ? !!possibleBitAsset.get("bitasset")
            : false;
        let collOrderObject = "";
        let settlePrice = null;
        let settlePriceTitle = "exchange.settle";
        let settlePriceTooltip = "tooltip.settle_price";

        if (isBitAsset) {
            if (account.toJS && account.has("call_orders")) {
                const call_orders = account.get("call_orders").toJS();

                for (let i = 0; i < call_orders.length; i++) {
                    let callID = call_orders[i];

                    let position = ChainStore.getObject(callID);
                    let debtAsset = position.getIn([
                        "call_price",
                        "quote",
                        "asset_id"
                    ]);

                    if (debtAsset === lookForBitAsset) {
                        collOrderObject = callID;
                        showCollateralRatio = true;
                        break;
                    }
                }
            }

            /* Settlment Offset */
            let settleAsset =
                baseId == "1.3.0"
                    ? quoteAsset
                    : quoteId == "1.3.0"
                        ? baseAsset
                        : quoteAsset;

            // globally settled
            if (possibleBitAsset.get("bitasset").get("settlement_fund") > 0) {
                settlePriceTitle = "exchange.global_settle";
                settlePriceTooltip = "tooltip.global_settle_price";
                settlePrice = possibleBitAsset
                    .get("bitasset")
                    .get("settlement_price")
                    .toJS();
                // add precision
                if (settlePrice.base.asset_id == baseAsset.get("id")) {
                    settlePrice.base.precision = baseAsset.get("precision");
                    settlePrice.quote.precision = quoteAsset.get("precision");
                } else {
                    settlePrice.quote.precision = baseAsset.get("precision");
                    settlePrice.base.precision = quoteAsset.get("precision");
                }
                settlePrice = new Price({
                    quote: new Asset({
                        asset_id: settlePrice.quote.asset_id,
                        precision: settlePrice.quote.precision,
                        amount: settlePrice.quote.amount
                    }),
                    base: new Asset({
                        asset_id: settlePrice.base.asset_id,
                        precision: settlePrice.base.precision,
                        amount: settlePrice.base.amount
                    })
                }).toReal();
                settlePrice = baseId == "1.3.0" ? 1 / settlePrice : settlePrice;
            } else if (settleAsset && feedPrice) {
                let offset_percent = settleAsset
                    .getIn(["bitasset", "options"])
                    .toJS().force_settlement_offset_percent;
                settlePrice =
                    baseId == "1.3.0"
                        ? feedPrice.toReal() / (1 + offset_percent / 10000)
                        : feedPrice.toReal() * (1 + offset_percent / 10000);
            }
        }

        const styles = {
            assetImage: {
                maxWidth: 16,
                maxHeight: 16,
                marginRight: 5,
                marginTop: -2
            }
        };

        const translator = require("counterpart");

        let isQuoteSelected =
            !!this.state.selectedMarketPickerAsset &&
            this.state.selectedMarketPickerAsset == quoteSymbol;
        let isBaseSelected =
            !!this.state.selectedMarketPickerAsset &&
            this.state.selectedMarketPickerAsset == baseSymbol;

        let PriceAlertBellClassName = this.props.hasAnyPriceAlert
            ? "exchange--price-alert--show-modal--active"
            : "";

        return (
            <div className="grid-block shrink no-padding overflow-visible top-bar">
                <div className="grid-block overflow-visible">
                    <div className="grid-block shrink">
                        <div style={{padding: "10px"}}>
                            {!hasPrediction ? (
                                <div
                                    style={{
                                        padding: "0 5px",
                                        fontSize: this.props.tinyScreen
                                            ? "13px"
                                            : "18px",
                                        marginTop: "1px"
                                    }}
                                >
                                    <AntIcon
                                        onClick={this.props.showPriceAlertModal}
                                        type={"bell"}
                                        className={`exchange--price-alert--show-modal ${PriceAlertBellClassName}`}
                                        data-intro={translator.translate(
                                            "walkthrough.price_alerts"
                                        )}
                                    />
                                    <span
                                        onClick={this.marketPicker.bind(
                                            this,
                                            quoteSymbol
                                        )}
                                        className="underline"
                                        style={{
                                            cursor: "pointer",
                                            color: isQuoteSelected
                                                ? "#2196f3"
                                                : ""
                                        }}
                                    >
                                        <AssetImage
                                            name={quoteSymbol}
                                            style={styles.assetImage}
                                        />
                                        <AssetName
                                            name={quoteSymbol}
                                            replace={true}
                                            noTip
                                            onRenderedName={name => {
                                                this._quoteName = name;
                                            }}
                                        />
                                    </span>
                                    <span style={{padding: "0 5px"}}>/</span>
                                    <span
                                        onClick={this.marketPicker.bind(
                                            this,
                                            baseSymbol
                                        )}
                                        className="underline"
                                        style={{
                                            cursor: "pointer",
                                            color: isBaseSelected
                                                ? "#2196f3"
                                                : ""
                                        }}
                                    >
                                        <AssetImage
                                            name={baseSymbol}
                                            style={styles.assetImage}
                                        />
                                        <AssetName
                                            name={baseSymbol}
                                            replace={true}
                                            noTip
                                            onRenderedName={name => {
                                                this._baseName = name;
                                            }}
                                        />
                                    </span>
                                </div>
                            ) : (
                                <a className="market-symbol">
                                    <span
                                    >{`${quoteSymbol} : ${baseSymbol}`}</span>
                                </a>
                            )}
                            <div className="label-actions">
                                <Translate
                                    component="span"
                                    style={{padding: "5px 0 0 5px"}}
                                    className="stat-text"
                                    content="exchange.trading_pair"
                                />
                                <Link
                                    onClick={() => {
                                        MarketsActions.switchMarket();
                                    }}
                                    to={`/market/${baseSymbol}_${quoteSymbol}`}
                                    data-intro={translator.translate(
                                        "walkthrough.switch_button"
                                    )}
                                >
                                    <Icon
                                        className="shuffle"
                                        name="shuffle"
                                        title="icons.shuffle"
                                    />
                                </Link>

                                <a
                                    onClick={() => {
                                        this._addMarket(
                                            this.props.quoteAsset.get("symbol"),
                                            this.props.baseAsset.get("symbol")
                                        );
                                    }}
                                    data-intro={translator.translate(
                                        "walkthrough.favourite_button"
                                    )}
                                >
                                    <Icon
                                        className={starClass}
                                        name="fi-star"
                                        title="icons.fi_star.market"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div
                        className="grid-block vertical"
                        style={{overflow: "visible"}}
                    >
                        <div className="grid-block wrap market-stats-container">
                            <ul className="market-stats stats top-stats">
                                {latestPrice ? (
                                    <PriceStatWithLabel
                                        ignoreColorChange={true}
                                        ready={marketReady}
                                        price={latestPrice}
                                        quote={quoteAsset}
                                        base={baseAsset}
                                        market={marketID}
                                        content="exchange.latest"
                                    />
                                ) : null}

                                <li
                                    className={
                                        "hide-order-1 stressed-stat daily_change " +
                                        dayChangeClass
                                    }
                                >
                                    <span>
                                        <b className="value">
                                            {marketReady
                                                ? dayChangeWithSign
                                                : 0}
                                        </b>
                                        <span> %</span>
                                    </span>
                                    <Translate
                                        component="div"
                                        className="stat-text"
                                        content="account.hour_24"
                                    />
                                </li>

                                {volumeBase >= 0 ? (
                                    <PriceStatWithLabel
                                        ignoreColorChange={true}
                                        onClick={this.changeVolumeBase.bind(
                                            this
                                        )}
                                        ready={marketReady}
                                        decimals={0}
                                        volume={{
                                            base: {
                                                volume: volumeBase,
                                                asset: baseAsset
                                            },
                                            quote: {
                                                volume: volumeQuote,
                                                asset: quoteAsset
                                            },
                                            swap: this.state.volumeShowQuote
                                        }}
                                        className="hide-order-2 clickable"
                                        market={marketID}
                                        content="exchange.volume_24"
                                    />
                                ) : null}
                                {!hasPrediction && feedPrice ? (
                                    <PriceStatWithLabel
                                        ignoreColorChange={true}
                                        toolTip={counterpart.translate(
                                            "tooltip.feed_price"
                                        )}
                                        ready={marketReady}
                                        className="hide-order-3"
                                        price={feedPrice.toReal()}
                                        quote={quoteAsset}
                                        base={baseAsset}
                                        market={marketID}
                                        content="exchange.feed_price"
                                    />
                                ) : null}
                                {!hasPrediction && settlePrice ? (
                                    <PriceStatWithLabel
                                        ignoreColorChange={true}
                                        toolTip={counterpart.translate(
                                            settlePriceTooltip
                                        )}
                                        ready={marketReady}
                                        className="hide-order-4"
                                        price={settlePrice}
                                        quote={quoteAsset}
                                        base={baseAsset}
                                        market={marketID}
                                        content={settlePriceTitle}
                                    />
                                ) : null}
                                {showCollateralRatio ? (
                                    <ExchangeHeaderCollateral
                                        object={collOrderObject}
                                        account={account}
                                        className="hide-order-1"
                                    />
                                ) : null}
                                {lowestCallPrice && showCallLimit ? (
                                    <PriceStatWithLabel
                                        toolTip={counterpart.translate(
                                            "tooltip.call_limit"
                                        )}
                                        ready={marketReady}
                                        className="hide-order-5 is-call"
                                        price={lowestCallPrice}
                                        quote={quoteAsset}
                                        base={baseAsset}
                                        market={marketID}
                                        content="explorer.block.call_limit"
                                    />
                                ) : null}

                                {feedPrice && showCallLimit ? (
                                    <PriceStatWithLabel
                                        toolTip={counterpart.translate(
                                            "tooltip.margin_price"
                                        )}
                                        ready={marketReady}
                                        className="hide-order-6 is-call"
                                        price={feedPrice.getSqueezePrice({
                                            real: true
                                        })}
                                        quote={quoteAsset}
                                        base={baseAsset}
                                        market={marketID}
                                        content="exchange.squeeze"
                                    />
                                ) : null}
                            </ul>
                            <ul
                                className="market-stats stats top-stats"
                                data-position={"left"}
                                data-step="1"
                                data-intro={translator.translate(
                                    "walkthrough.personalize"
                                )}
                            >
                                {!this.props.tinyScreen ? (
                                    <li
                                        className="stressed-stat input clickable column-hide-xs"
                                        style={{padding: "16px 16px 16px 0px"}}
                                        onClick={this.props.onToggleQuickChartType.bind(
                                            this
                                        )}
                                    >
                                        <AntIcon
                                            type={
                                                this.props.chartType ===
                                                "market_depth"
                                                    ? "bar-chart"
                                                    : "area-chart"
                                            }
                                            style={{paddingRight: 5}}
                                        />
                                        <Translate
                                            content={
                                                this.props.chartType ===
                                                "market_depth"
                                                    ? "exchange.price_history"
                                                    : "exchange.market_depth"
                                            }
                                        />
                                    </li>
                                ) : null}
                                <li
                                    className="stressed-stat input clickable"
                                    style={{padding: "16px 16px 16px 0px"}}
                                    onClick={this.props.onTogglePersonalize.bind(
                                        this
                                    )}
                                >
                                    <AntIcon
                                        type="setting"
                                        style={{paddingRight: 5}}
                                    />
                                    <Translate
                                        className="hide-order-2"
                                        content="exchange.settings.header.title"
                                    />
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
