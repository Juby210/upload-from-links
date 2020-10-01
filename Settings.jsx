const { React } = require("powercord/webpack");
const { SwitchItem } = require("powercord/components/settings");


module.exports = class Settings extends React.Component {
    render() {
        const { getSetting, toggleSetting } = this.props;

        return (
            <div>
                <SwitchItem
                    note="Automatically upload from links when you have the attach images permission, but no embed links permission."
                    value={ getSetting("autoUpload", false) }
                    onChange={ () => toggleSetting("autoUpload") }
                >
                    Automatic upload.
                </SwitchItem>
            </div>
        );
    }
};
