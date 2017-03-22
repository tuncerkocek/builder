import vcCake from 'vc-cake'
import DnD from '../../../../../../resources/dnd/dnd'

require('../../../../../../sources/less/content/layout/dnd/init.less')
export default class DndManager {
  constructor (api) {
    Object.defineProperties(this, {
      /**
       * @memberOf! DndManager
       */
      api: {
        value: api,
        writable: false,
        enumerable: false,
        configurable: false
      },
      /**
       * @memberOf! DndManager
       */
      documentDOM: {
        value: null,
        writable: true,
        enumerable: false,
        configurable: true
      },
      /**
       * @memberOf! DndManager
       */
      items: {
        value: null,
        writable: true,
        enumerable: false,
        configurable: true
      }
    })
  }

  buildItems () {
    if (!this.items) {
      this.items = new DnD(document.querySelector('[data-vcv-module="content-layout"]'), {
        cancelMove: true,
        moveCallback: this.move.bind(this),
        startCallback: DndManager.start,
        endCallback: DndManager.end,
        container: document.querySelector('#vcwb_visual_composer > .inside'),
        handler: '> .vce-wpbackend-element-header-container, > div > div > vcvhelper.vcv-row-control-container'
      })
      this.items.init()
      this.apiDnD = DnD.api(this.items)
      vcCake.onDataChange('draggingElement', this.apiDnD.start.bind(this.apiDnD))
      this.api.reply('ui:settingsUpdated', this.updateOffsetTop.bind(this))
      vcCake.onDataChange('vcv:layoutCustomMode', (value) => {
        this.items.option('disabled', value === 'contentEditable' || value === 'columnResizer')
      })
    }
  }

  getOffsetTop () {
    if (this.iframe) {
      let rect = this.iframe.getBoundingClientRect()
      return rect.top
    }
    return 0
  }

  updateOffsetTop () {
    this.items.option('offsetTop', this.getOffsetTop())
  }

  init () {
    this.api
      .on('element:mount', this.add.bind(this))
      .on('element:unmount', this.remove.bind(this))
      .on('element:didUpdate', this.update.bind(this))
  }

  add (id) {
    this.buildItems()
    this.items.addItem(id, this.documentDOM)
  }

  remove (id) {
    this.buildItems()
    this.items.removeItem(id)
  }

  update (id) {
    this.buildItems()
    this.items.updateItem(id, this.documentDOM)
  }

  move (id, action, related) {
    if (id && related) {
      this.api.request('data:move', id, { action: action, related: related })
    }
  }

  static start () {
    vcCake.setData('elementControls:disable', true)
    document.body.classList.add('vcv-is-no-selection')
  }

  static end () {
    vcCake.setData('elementControls:disable', false)
    document.body.classList.remove('vcv-is-no-selection')
  }
}
