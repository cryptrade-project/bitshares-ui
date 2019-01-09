import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import AssetName from "../Utility/AssetName";
import MarginPositionsTable from "./MarginPositionsTable";
import {RecentTransactions} from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "bitsharesjs";
import SettingsActions from "actions/SettingsActions";
import utils from "common/utils";
import {Tabs, Tab} from "../Utility/Tabs";
import AccountOrders from "./AccountOrders";
import cnames from "classnames";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {checkMarginStatus} from "common/accountHelper";
import BalanceWrapper from "./BalanceWrapper";
import AccountTreemap from "./AccountTreemap";
import AssetWrapper from "../Utility/AssetWrapper";
import AccountPortfolioList from "./AccountPortfolioList";
import {Input, Icon, Switch} from "bitshares-ui-style-guide";
import asset_utils from "../../lib/common/asset_utils";

class AccountOverview extends React.Component {
    constructor(props) {
        super();
        this.state = {
            sortKey: props.viewSettings.get("portfolioSort", "totalValue"),
            sortDirection: props.viewSettings.get(
                "portfolioSortDirection",
                true
            ), // alphabetical A -> B, numbers high to low
            shownAssets: props.viewSettings.get("shownAssets", "active"),
            alwaysShowAssets: [
                "BTS"
                // "USD",
                // "CNY",
                // "OPEN.BTC",
                // "OPEN.USDT",
                // "OPEN.ETH",
                // "OPEN.MAID",
                // "OPEN.STEEM",
                // "OPEN.DASH"
            ],
            hideFishingProposals: true
        };

        this._handleFilterInput = this._handleFilterInput.bind(this);
    }

    _handleFilterInput(e) {
        e.preventDefault();
        this.setState({
            filterValue: e.target.value
        });
    }

    componentWillMount() {
        this._checkMarginStatus();
    }

    _checkMarginStatus(props = this.props) {
        checkMarginStatus(props.account).then(status => {
            let globalMarginStatus = null;
            for (let asset in status) {
                globalMarginStatus =
                    status[asset].statusClass || globalMarginStatus;
            }
            this.setState({globalMarginStatus});
        });
    }

    componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            this._checkMarginStatus(np);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets ||
            !utils.are_equal_shallow(nextState, this.state) ||
            this.state.filterValue !== nextState.filterValue
        );
    }

    _changeShownAssets(shownAssets = "active") {
        this.setState({
            shownAssets
        });
        SettingsActions.changeViewSetting({
            shownAssets
        });
    }

    _toggleSortOrder(key) {
        if (this.state.sortKey === key) {
            SettingsActions.changeViewSetting({
                portfolioSortDirection: !this.state.sortDirection
            });
            this.setState({
                sortDirection: !this.state.sortDirection
            });
        } else {
            SettingsActions.changeViewSetting({
                portfolioSort: key
            });
            this.setState({
                sortDirection: false,
                sortKey: key
            });
        }
    }
    _toggleHideProposal() {
        this.setState({
            hideFishingProposals: !this.state.hideFishingProposals
        });
    }

    getHeader() {
        let {settings} = this.props;
        let {shownAssets} = this.state;

        const preferredUnit =
            settings.get("unit") || this.props.core_asset.get("symbol");
        const showAssetPercent = settings.get("showAssetPercent", false);
        const showAdvancedFeatures = settings.get(
            "showAdvancedFeatures",
            false
        );

        return (
            <tr>
                <th
                    style={{textAlign: "left"}}
                    className={cnames("clickable is-sortable", {
                        "is-active": this.state.sortKey === "alphabetic"
                    })}
                    onClick={this._toggleSortOrder.bind(this, "alphabetic")}
                >
                    <Translate component="span" content="account.asset" />
                </th>
                <th
                    onClick={this._toggleSortOrder.bind(this, "qty")}
                    className={cnames("clickable is-sortable", {
                        "is-active": this.state.sortKey === "qty"
                    })}
                    style={{textAlign: "right"}}
                >
                    <Translate content="account.qty" />
                </th>
                <th
                    onClick={this._toggleSortOrder.bind(this, "priceValue")}
                    className={cnames(
                        "column-hide-small clickable is-sortable",
                        {"is-active": this.state.sortKey === "priceValue"}
                    )}
                    style={{textAlign: "right"}}
                >
                    <Translate content="exchange.price" /> (
                    <AssetName name={preferredUnit} noTip />)
                </th>
                <th
                    onClick={this._toggleSortOrder.bind(this, "changeValue")}
                    className={cnames(
                        "column-hide-small clickable is-sortable",
                        {"is-active": this.state.sortKey === "changeValue"}
                    )}
                    style={{textAlign: "right"}}
                >
                    <Translate content="account.hour_24_short" />
                </th>
                <th
                    onClick={this._toggleSortOrder.bind(this, "totalValue")}
                    style={{textAlign: "right"}}
                    className={cnames(
                        "column-hide-small clickable is-sortable",
                        {"is-active": this.state.sortKey === "totalValue"}
                    )}
                >
                    <TranslateWithLinks
                        noLink
                        string="account.eq_value_header"
                        keys={[
                            {
                                type: "asset",
                                value: preferredUnit,
                                arg: "asset"
                            }
                        ]}
                        noTip
                    />
                </th>
                {showAssetPercent ? (
                    <th
                        style={{
                            textAlign: "right"
                        }}
                    >
                        <Translate component="span" content="account.percent" />
                    </th>
                ) : null}
                <th>
                    <Translate content="header.payments" />
                </th>
                <th>
                    <Translate content="exchange.buy" />
                </th>
                <th>
                    <Translate content="modal.deposit.submit" />
                </th>
                <th>
                    <Translate content="modal.withdraw.submit" />
                </th>
                <th>
                    <Translate content="account.trade" />
                </th>
                <th>
                    <Translate content="exchange.borrow_short" />
                </th>
                {showAdvancedFeatures ? (
                    <th>
                        <Translate content="account.settle" />
                    </th>
                ) : null}
                {showAdvancedFeatures ? (
                    <th className="column-hide-small">
                        <Translate content="modal.reserve.submit" />
                    </th>
                ) : null}
                <th className="column-hide-small">
                    <Translate
                        content={
                            shownAssets == "active"
                                ? "exchange.hide"
                                : "account.perm.show"
                        }
                    />
                </th>
            </tr>
        );
    }

    render() {
        let {account, hiddenAssets, settings, orders} = this.props;
        let {shownAssets} = this.state;

        if (!account) {
            return null;
        }

        const preferredUnit =
            settings.get("unit") || this.props.core_asset.get("symbol");

        const showAdvancedFeatures = settings.get(
            "showAdvancedFeatures",
            false
        );

        let call_orders = [],
            collateral = {},
            debt = {};

        if (account.toJS && account.has("call_orders"))
            call_orders = account.get("call_orders").toJS();
        let includedPortfolioList,
            activePortfolioList,
            inactivePortfolioList,
            hiddenPortfolioList;
        let account_balances = account.get("balances");
        let includedBalancesList = Immutable.List(),
            activeBalancesList = Immutable.List(),
            inactiveBalancesList = Immutable.List(),
            hiddenBalancesList = Immutable.List();
        call_orders.forEach(callID => {
            let position = ChainStore.getObject(callID);
            if (position) {
                let collateralAsset = position.getIn([
                    "call_price",
                    "base",
                    "asset_id"
                ]);
                if (!collateral[collateralAsset]) {
                    collateral[collateralAsset] = parseInt(
                        position.get("collateral"),
                        10
                    );
                } else {
                    collateral[collateralAsset] += parseInt(
                        position.get("collateral"),
                        10
                    );
                }
                let debtAsset = position.getIn([
                    "call_price",
                    "quote",
                    "asset_id"
                ]);
                if (!debt[debtAsset]) {
                    debt[debtAsset] = parseInt(position.get("debt"), 10);
                } else {
                    debt[debtAsset] += parseInt(position.get("debt"), 10);
                }
            }
        });

        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            account_balances = account_balances.filter((a, index) => {
                let balanceObject = ChainStore.getObject(a);
                if (
                    balanceObject &&
                    (!balanceObject.get("balance") && !orders[index])
                ) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                const asset = ChainStore.getAsset(asset_type);

                let assetName = asset ? asset.get("symbol").toLowerCase() : "";
                let {isBitAsset} = utils.replaceName(asset);
                let isCryptradeIssued = asset_utils.isCryptradeIssuedAsset(
                    asset
                );
                let filter = "";

                if (this.state.filterValue) {
                    filter = this.state.filterValue
                        ? String(this.state.filterValue).toLowerCase()
                        : "";
                    if (isBitAsset) {
                        assetName = "bit" + assetName;
                    }
                }

                if (
                    hiddenAssets.includes(asset_type) &&
                    assetName.includes(filter)
                ) {
                    hiddenBalancesList = hiddenBalancesList.push(a);
                } else if (assetName.includes(filter)) {
                    includedBalancesList = includedBalancesList.push(a);
                    if (
                        asset_type === "1.3.0" ||
                        isBitAsset ||
                        isCryptradeIssued
                    ) {
                        activeBalancesList = activeBalancesList.push(a);
                    } else {
                        inactiveBalancesList = inactiveBalancesList.push(a);
                    }
                }
            });
        }

        let portfolioHiddenAssetsBalance = (
            <TotalBalanceValue noTip balances={hiddenBalancesList} hide_asset />
        );

        let portfolioIncludedAssetsBalance = (
            <TotalBalanceValue
                noTip
                balances={includedBalancesList}
                hide_asset
            />
        );
        let portfolioActiveAssetsBalance = (
            <TotalBalanceValue noTip balances={activeBalancesList} hide_asset />
        );
        let portfolioInactiveAssetsBalance = (
            <TotalBalanceValue
                noTip
                balances={inactiveBalancesList}
                hide_asset
            />
        );
        let ordersValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                openOrders={orders}
                hide_asset
            />
        );
        let marginValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                debt={debt}
                collateral={collateral}
                hide_asset
            />
        );
        let debtValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                debt={debt}
                hide_asset
            />
        );
        let collateralValue = (
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                collateral={collateral}
                hide_asset
            />
        );

        const totalValueText = (
            <TranslateWithLinks
                noLink
                string="account.total"
                keys={[{type: "asset", value: preferredUnit, arg: "asset"}]}
            />
        );

        const activePortfolioBalance = (
            <tr key="portfolio" className="total-value">
                <td colSpan="2" style={{textAlign: "left"}}>
                    {totalValueText}
                </td>
                <td className="column-hide-small" />
                <td className="column-hide-small" />
                <td style={{textAlign: "right"}}>
                    {portfolioActiveAssetsBalance}
                </td>
                <td colSpan="9" />
            </tr>
        );

        const inactivePortfolioBalance = (
            <tr key="portfolio" className="total-value">
                <td colSpan="2" style={{textAlign: "left"}}>
                    {totalValueText}
                </td>
                <td className="column-hide-small" />
                <td className="column-hide-small" />
                <td style={{textAlign: "right"}}>
                    {portfolioInactiveAssetsBalance}
                </td>
                <td colSpan="9" />
            </tr>
        );

        const hiddenPortfolioBalance = (
            <tr key="portfolio" className="total-value">
                <td colSpan="2" style={{textAlign: "left"}}>
                    {totalValueText}
                </td>
                <td className="column-hide-small" />
                <td className="column-hide-small" />
                <td style={{textAlign: "right"}}>
                    {portfolioHiddenAssetsBalance}
                </td>
                <td colSpan="9" />
            </tr>
        );

        activePortfolioList = (
            <AccountPortfolioList
                balanceList={activeBalancesList}
                optionalAssets={
                    !this.state.filterValue ? this.state.alwaysShowAssets : null
                }
                visible={true}
                preferredUnit={preferredUnit}
                coreAsset={this.props.core_asset}
                coreSymbol={this.props.core_asset.get("symbol")}
                hiddenAssets={hiddenAssets}
                orders={orders}
                account={this.props.account}
                sortKey={this.state.sortKey}
                sortDirection={this.state.sortDirection}
                isMyAccount={this.props.isMyAccount}
                balances={this.props.balances}
                header={this.getHeader()}
                extraRow={activePortfolioBalance}
                showAdvancedFeatures={showAdvancedFeatures}
            />
        );

        inactivePortfolioList = (
            <AccountPortfolioList
                balanceList={inactiveBalancesList}
                optionalAssets={
                    !this.state.filterValue ? this.state.alwaysShowAssets : null
                }
                visible={true}
                preferredUnit={preferredUnit}
                coreAsset={this.props.core_asset}
                coreSymbol={this.props.core_asset.get("symbol")}
                hiddenAssets={hiddenAssets}
                orders={orders}
                account={this.props.account}
                sortKey={this.state.sortKey}
                sortDirection={this.state.sortDirection}
                isMyAccount={this.props.isMyAccount}
                balances={this.props.balances}
                header={this.getHeader()}
                extraRow={inactivePortfolioBalance}
                showAdvancedFeatures={showAdvancedFeatures}
            />
        );

        hiddenPortfolioList = (
            <AccountPortfolioList
                balanceList={hiddenBalancesList}
                optionalAssets={
                    !this.state.filterValue ? this.state.alwaysShowAsset : null
                }
                visible={false}
                preferredUnit={preferredUnit}
                coreSymbol={this.props.core_asset.get("symbol")}
                settings={settings}
                hiddenAssets={hiddenAssets}
                orders={orders}
                account={this.props.account}
                sortKey={this.state.sortKey}
                sortDirection={this.state.sortDirection}
                isMyAccount={this.props.isMyAccount}
                balances={this.props.balances}
                header={this.getHeader()}
                extraRow={hiddenPortfolioBalance}
            />
        );

        // add unicode non-breaking space as subtext to Activity Tab to ensure that all titles are aligned
        // horizontally
        const hiddenSubText = "\u00a0";

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            defaultActiveTab={0}
                            segmented={false}
                            setting="overviewTab"
                            className="account-tabs"
                            tabsClass="account-overview no-padding bordered-header content-block"
                        >
                            <Tab
                                title="account.portfolio"
                                subText={portfolioIncludedAssetsBalance}
                            >
                                <div className="header-selector">
                                    <div className="filter inline-block">
                                        <Input
                                            type="text"
                                            placeholder="Filter..."
                                            onChange={this._handleFilterInput}
                                            addonAfter={<Icon type="search" />}
                                        />
                                    </div>
                                    <div
                                        className="selector inline-block"
                                        style={{
                                            position: "relative",
                                            top: "6px"
                                        }}
                                    >
                                        <div
                                            className={cnames("inline-block", {
                                                inactive:
                                                    shownAssets != "active"
                                            })}
                                            onClick={
                                                shownAssets != "active"
                                                    ? this._changeShownAssets.bind(
                                                          this,
                                                          "active"
                                                      )
                                                    : () => {}
                                            }
                                        >
                                            <Translate content="cryptrade.account.show_active" />
                                        </div>
                                        {inactiveBalancesList.size ? (
                                            <div
                                                className={cnames(
                                                    "inline-block",
                                                    {
                                                        inactive:
                                                            shownAssets !=
                                                            "inactive"
                                                    }
                                                )}
                                                onClick={
                                                    shownAssets != "inactive"
                                                        ? this._changeShownAssets.bind(
                                                              this,
                                                              "inactive"
                                                          )
                                                        : () => {}
                                                }
                                            >
                                                <Translate content="cryptrade.account.show_inactive" />
                                            </div>
                                        ) : null}
                                        {hiddenBalancesList.size ? (
                                            <div
                                                className={cnames(
                                                    "inline-block",
                                                    {
                                                        inactive:
                                                            shownAssets !=
                                                            "hidden"
                                                    }
                                                )}
                                                onClick={
                                                    shownAssets != "hidden"
                                                        ? this._changeShownAssets.bind(
                                                              this,
                                                              "hidden"
                                                          )
                                                        : () => {}
                                                }
                                            >
                                                <Translate content="cryptrade.account.show_hidden" />
                                            </div>
                                        ) : null}
                                        <div
                                            className={cnames("inline-block", {
                                                inactive:
                                                    shownAssets != "visual"
                                            })}
                                            onClick={
                                                shownAssets != "visual"
                                                    ? this._changeShownAssets.bind(
                                                          this,
                                                          "visual"
                                                      )
                                                    : () => {}
                                            }
                                        >
                                            <Translate content="cryptrade.account.show_visual" />
                                        </div>
                                    </div>
                                </div>

                                {shownAssets != "visual" ? (
                                    shownAssets === "hidden" &&
                                    hiddenBalancesList.size ? (
                                        hiddenPortfolioList
                                    ) : shownAssets === "inactive" ? (
                                        inactivePortfolioList
                                    ) : (
                                        activePortfolioList
                                    )
                                ) : (
                                    <AccountTreemap
                                        balanceObjects={includedBalancesList}
                                    />
                                )}
                            </Tab>

                            <Tab
                                title="account.open_orders"
                                subText={ordersValue}
                            >
                                <AccountOrders {...this.props}>
                                    <tr className="total-value">
                                        <td
                                            colSpan="8"
                                            style={{textAlign: "right"}}
                                        >
                                            {totalValueText}
                                        </td>
                                        <td
                                            colSpan="1"
                                            style={{textAlign: "right"}}
                                        >
                                            {ordersValue}
                                        </td>
                                        {this.props.isMyAccount ? <td /> : null}
                                    </tr>
                                </AccountOrders>
                            </Tab>

                            <Tab
                                title="account.activity"
                                subText={hiddenSubText}
                            >
                                <RecentTransactions
                                    accountsList={Immutable.fromJS([
                                        account.get("id")
                                    ])}
                                    compactView={false}
                                    showMore={true}
                                    fullHeight={true}
                                    limit={100}
                                    showFilters={true}
                                    dashboard
                                />
                            </Tab>

                            {account.get("proposals") &&
                            account.get("proposals").size ? (
                                <Tab
                                    title="explorer.proposals.title"
                                    subText={String(
                                        account.get("proposals")
                                            ? account.get("proposals").size
                                            : 0
                                    )}
                                >
                                    <div>
                                        <Switch
                                            style={{margin: 16}}
                                            checked={
                                                this.state.hideFishingProposals
                                            }
                                            onChange={this._toggleHideProposal.bind(
                                                this
                                            )}
                                        />
                                        <Translate content="account.deactivate_suspicious_proposals" />
                                    </div>
                                    <Proposals
                                        className="dashboard-table"
                                        account={account.get("id")}
                                        hideFishingProposals={
                                            this.state.hideFishingProposals
                                        }
                                    />
                                </Tab>
                            ) : null}
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}

AccountOverview = AssetWrapper(AccountOverview, {propNames: ["core_asset"]});

export default class AccountOverviewWrapper extends React.Component {
    render() {
        return <BalanceWrapper {...this.props} wrap={AccountOverview} />;
    }
}
