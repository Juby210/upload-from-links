const { readFileSync } = require('fs')
const { Plugin } = require('powercord/entities')
const { getModule, messages } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')
const { get } = require('powercord/http')

module.exports = class UploadFromLinks extends Plugin {
    async startPlugin() {
        inject('ufl', messages, 'sendMessage', args => {
            if (this.processMessage(args[0], args[1])) return false
            return args
        }, true)
    }

    pluginWillUnload() {
        uninject('ufl')
    }

    processMessage(cid, msg) {
        const files = []
        const search = msg.content.split('[').join('][').split(']')

        for (let i = 0; i < search.length; i++) {
            const arr = search[i].replace('[', '').split(',')
            let name = arr[1] || arr[0].split('/').pop().split('?')[0]

            if (search[i].startsWith('[http')) {
                files.push({ url: arr[0], name })
                msg.content = msg.content.replace(search[i] + ']', '')
            } else if ((process.platform == 'win32' && search[i].match(/^[A-Z]:(\/|\\)/)) ||
            (process.platform != 'win32' && search[i].startsWith('[/'))) {
                if (name.includes('\\')) name = name.split('\\').pop()
                files.push({ path: arr[0], name })
                msg.content = msg.content.replace(search[i] + ']', '')
            }
        }

        if (files.length) this.uploadFiles(cid, msg, files)

        return files.length
    }

    async uploadFiles(cid, msg, files) {
        const { upload } = await getModule(['cancel', 'upload'])

        for (let i = 0; i < files.length; i++) {
            let file
            if (files[i].url) file = new File([ (await get(encodeURI(files[i].url))).body ], files[i].name)
            else file = new File([readFileSync(files[i].path)], files[i].name)
            upload(cid, file, msg)
            msg.content = ''
        }
    }
}
