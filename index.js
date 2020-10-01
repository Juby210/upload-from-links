const { readFileSync } = require("fs");
const { Plugin } = require("powercord/entities");
const { getModule, messages } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { get } = require("powercord/http");

const Permissions = getModule(["getHighestRole"], false);
const DiscordPermissions = getModule(["Permissions"], false).Permissions;
const { getChannel } = getModule(["getChannel"], false);

const Settings = require("./Settings.jsx");


module.exports = class UploadFromLinks extends Plugin {
    async startPlugin() {
        inject("ufl", messages, "sendMessage", args => {
            if (this.processMessage(args[0], args[1])) return false;
            return args;
        }, true);

        powercord.api.settings.registerSettings("upload-from-links", {
            category: this.entityID,
            label: "Upload From Links",
            render: Settings,
        });
    }

    pluginWillUnload() {
        uninject("ufl");
        powercord.api.settings.unregisterSettings("upload-from-links");
    }

    processMessage(channelId, msg) {
        if (!msg.content) return;

        const files = [];
        const channel = getChannel(channelId);
        const autoMode =
            !this.permissionCheck(channel, DiscordPermissions.EMBED_LINKS) && this.settings.get("autoUpload");

        let regex = RegExp(/\[([^\]]+)]/g);
        if (autoMode) {
            regex = RegExp(/(https?:\/\/[^.]+\.[^/]+\/[^.]+\.\w{1,7})/g);
        }

        const urls = msg.content.match(regex);
        if (!urls) return;

        urls.forEach(url => {
            url = url.replace("[", "").replace("]", "");
            if (url.startsWith("http")) {
                files.push({url: url, name: url.split("/").pop()});
                if (autoMode) {
                    msg.content = msg.content.replace(url, "");
                } else {
                    msg.content = msg.content.replace(`[${url}]`, "");
                }
            }
        });

        if (files.length && this.permissionCheck(channel, DiscordPermissions.ATTACH_FILES)) {
            this.uploadFiles(channelId, msg, files).catch(console.log);
        }
        return files.length;
    }

    async uploadFiles(channelId, msg, files) {
        const { upload } = await getModule(["cancel", "upload"]);

        for (let i = 0; i < files.length; i++) {
            let file;
            if (files[i].url) file = new File([ (await get(encodeURI(files[i].url))).body ], files[i].name);
            else file = new File([readFileSync(files[i].path)], files[i].name);

            upload(channelId, file, msg);
            msg.content = "";
        }
    }

    permissionCheck(channel, permission) {
        return Permissions.can(permission, channel) || channel.type === 1 || channel.type === 3;
    }
}
