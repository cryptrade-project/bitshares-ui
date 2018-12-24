import assetConstants from "../chain/asset_constants";
import sanitize from "sanitize";
import {
    getCryptradeAssetNamespace,
    getCryptradeRealAssetNames
} from "../../branding";

export default class AssetUtils {
    static getFlagBooleans(mask, isBitAsset = false) {
        let booleans = {
            charge_market_fee: false,
            white_list: false,
            override_authority: false,
            transfer_restricted: false,
            disable_force_settle: false,
            global_settle: false,
            disable_confidential: false,
            witness_fed_asset: false,
            committee_fed_asset: false
        };

        if (mask === "all") {
            for (let flag in booleans) {
                if (
                    !isBitAsset &&
                    assetConstants.uia_permission_mask.indexOf(flag) === -1
                ) {
                    delete booleans[flag];
                } else {
                    booleans[flag] = true;
                }
            }
            return booleans;
        }

        for (let flag in booleans) {
            if (
                !isBitAsset &&
                assetConstants.uia_permission_mask.indexOf(flag) === -1
            ) {
                delete booleans[flag];
            } else {
                if (mask & assetConstants.permission_flags[flag]) {
                    booleans[flag] = true;
                }
            }
        }

        return booleans;
    }

    static getFlags(flagBooleans) {
        let keys = Object.keys(assetConstants.permission_flags);

        let flags = 0;

        keys.forEach(key => {
            if (flagBooleans[key] && key !== "global_settle") {
                flags += assetConstants.permission_flags[key];
            }
        });

        return flags;
    }

    static getPermissions(flagBooleans, isBitAsset = false) {
        let permissions = isBitAsset
            ? Object.keys(assetConstants.permission_flags)
            : assetConstants.uia_permission_mask;
        let flags = 0;
        permissions.forEach(permission => {
            if (flagBooleans[permission] && permission !== "global_settle") {
                flags += assetConstants.permission_flags[permission];
            }
        });

        if (isBitAsset) {
            flags += assetConstants.permission_flags["global_settle"];
        }

        return flags;
    }

    static parseDescription(description) {
        let parsed;

        try {
            parsed = JSON.parse(description);
        } catch (error) {}
        for (let key in parsed) {
            parsed[key] = sanitize(parsed[key], {
                whiteList: [], // empty, means filter out all tags
                stripIgnoreTag: true // filter out all HTML not in the whilelist
            });
        }
        return parsed ? parsed : {main: description};
    }

    static replaceAssetSymbol(symbol) {
        const names = getCryptradeRealAssetNames();
        if (symbol && names[symbol]) {
            return names[symbol];
        }
        return symbol;
    }

    static getCleanAssetSymbol(symbol) {
        return symbol.toUpperCase().replace(getCryptradeAssetNamespace(), "");
    }

    static isCryptradeIssuedAsset(asset) {
        if (!asset) return false;
        return asset.get("symbol").indexOf(getCryptradeAssetNamespace()) === 0;
    }

    static addCryptradeNameSpace(symbol) {
        let namespace = getCryptradeAssetNamespace();
        if (
            symbol &&
            symbol.indexOf(namespace) === -1 &&
            symbol.indexOf(".") === -1
        ) {
            return namespace + symbol;
        }

        return symbol;
    }

    static getTradingPairInfoMessages(asset, deposit) {
        if (!asset || !asset.tradingPairInfo) {
            return [];
        }

        return asset.tradingPairInfo.filter(info => {
            if (
                deposit &&
                info.disabled &&
                info.outputCoinType === asset.symbol.toLowerCase()
            ) {
                return true;
            }
            if (
                !deposit &&
                info.disabled &&
                info.inputCoinType === asset.symbol.toLowerCase()
            ) {
                return true;
            }
            return false;
        });
    }
}
