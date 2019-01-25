import React from "react";
import {connect} from "alt-react";
import LazyImage from "./LazyImage";
import CryptradeStore from "../../stores/CryptradeStore";
import PropTypes from "prop-types";
import {
    getCryptradeAssetNamespace,
    getCryptradeStaticURL
} from "../../branding";

class AssetImage extends React.Component {
    static propTypes = {
        name: PropTypes.string
    };

    constructor(props) {
        super();

        this.state = {
            src: this._getImgSrcFromProps(props)
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.name !== this.props.name) {
            this.setState({src: this._getImgSrcFromProps(nextProps)});
        }
    }

    _onImageError() {
        this.setState({src: null});
    }

    _getImgSrcFromProps(props) {
        let {name} = props;

        let img, symbol;
        if (name) {
            const imgSplit = name.split(".");
            symbol = imgSplit.length === 2 ? imgSplit[1] : imgSplit[0];
            if (
                imgSplit.length !== 2 ||
                name.toUpperCase().indexOf(getCryptradeAssetNamespace()) === 0
            ) {
                img = `${getCryptradeStaticURL()}/asset-symbols/${symbol.toLowerCase()}.png`;
            }
        }

        return img;
    }

    render() {
        const {style, lazy, className} = this.props;
        const {src} = this.state;

        return src ? (
            <LazyImage
                onError={this._onImageError.bind(this)}
                style={style || {}}
                src={src}
                lazy={lazy === true}
                className={className}
            />
        ) : (
            <span />
        );
    }
}

export default connect(
    AssetImage,
    {
        listenTo() {
            return [CryptradeStore];
        }
    }
);
