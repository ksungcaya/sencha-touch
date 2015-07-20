Ext.define('Ext.ux.field.ComboBox', {
    extend: 'Ext.field.Text',
    alias : 'widget.combobox',
    requires: [
        'Ext.Panel',
        'Ext.data.StoreManager',
        'Ext.dataview.DataView',
        'Ext.field.Text',
        'Ext.util.DelayedTask',
        'Ext.Array'
    ],

    config: {

        /**
         * @cfg {Boolean} multiple
         * Allow or disallow multiple selection
         */
        multiple: false,

        /**
         * @cfg {String/Number} valueField The underlying {@link Ext.data.Field#name data value name} (or numeric Array index) to bind to this
         * Select control.
         * @accessor
         */
        valueField: 'value',

        /**
         * @cfg {String/Number} displayField The underlying {@link Ext.data.Field#name data value name} (or numeric Array index) to bind to this
         * Select control. This resolved value is the visibly rendered value of the available selection options.
         * @accessor
         */
        displayField: 'text',

        /**
         * @cfg {Ext.data.Store/Object/String} store The store to provide selection options data.
         * Either a Store instance, configuration object or store ID.
         * @accessor
         */
        store: null,

        /**
         * @cfg {Array} options An array of select options.
         *
         *     [
         *         {text: 'First Option',  value: 'first'},
         *         {text: 'Second Option', value: 'second'},
         *         {text: 'Third Option',  value: 'third'}
         *     ]
         *
         * __Note:__ Option object member names should correspond with defined {@link #valueField valueField} and {@link #displayField displayField} values.
         * This config will be ignored if a {@link #store store} instance is provided.
         * @accessor
         */
        options: null,

        /**
         * @cfg {String} hiddenName Specify a `hiddenName` if you're using the {@link Ext.form.Panel#standardSubmit standardSubmit} option.
         * This name will be used to post the underlying value of the select to the server.
         * @accessor
         */
        hiddenName: null,

        /**
         * @cfg {Object} component
         * @accessor
         * @hide
         */
        component: {
            useMask: true
        },

        /**
         * @cfg {Boolean} clearIcon
         * @hide
         * @accessor
         */
        clearIcon: false,

        /**
         * @cfg {Boolean} autoSelect
         * `true` to auto select the first value in the {@link #store} or {@link #options} when they are changed. Only happens when
         * the {@link #value} is set to `null`.
         */
        autoSelect: false,

        /**
         * @cfg {Object} pickerConfig
         * The default configuration for the picker component when you are on a tablet.
         */
        pickerConfig: null,

        /**
         * Allow search ?
         * @type {Boolean}
         */
        searchEnabled: true,

        /**
         * @cfg {Number}
         * Delay in `ms` to perform the option search
         */
        searchDelay: 300,

        /**
         * @cfg {String}
         * The text that will appear when {@link #multiple} is true and the user has selected one or more options
         */
        addMoreText: 'Add more..'
    },

    /**
     * Records array that will hold all the selected records.
     * @type {Array}
     */
    records: [],

    // @private
    initialize: function() {
        var me = this,
            component = me.getComponent();

        me.callParent();

        component.on({
            scope: me,
            masktap: 'onMaskTap'
        });

        component.doMaskTap = Ext.emptyFn;

        if (Ext.browser.is.AndroidStock2) {
            component.input.dom.disabled = true;
        }

        if (Ext.theme.is.Blackberry) {
            me.label.on({
                scope: me,
                tap: 'onFocus'
            });
        }

        if (me.getMultiple()) {
            me.addResultListener();
        }
    },

    /**
     * @private
     * Add listeners to the 'results' element.
     */
    addResultListener: function() {
        var me = this, 
            results = me.results;

       if ( ! results.hasListener('tap')) {
            me.results.on({
                scope: me,
                tap: 'onResultsTap'
            });
       }
    },

    /**
     * Will only be triggered if the 'x' button was tapped.
     * @param  {Object} e Event object
     * @return {Void} 
     */
    onResultsTap: function(e) {
        var me = this,
            el = Ext.get(e.target),
            dataAttr, record;

        if (el.hasCls(Ext.baseCSSPrefix + 'remove-choice')) {
            dataAttr = el.getParent().getAttribute('data-' + me.getValueField());
            record = me.getRecordFromValue(dataAttr, me.getOriginalStore());

            if (record) {
                me.deselectOption(record);
            }
        }
    },

    syncEmptyCls: Ext.emptyFn,

    // @private
    onMaskTap: function() {
        this.onFocus();

        return false;
    },

    onFocus: function(e) {
        if (this.getDisabled()) {
            return false;
        }

        var component = this.getComponent();
        this.fireEvent('focus', this, e);

        if (Ext.os.is.Android4) {
            component.input.dom.focus();
        }
        // should be removed if we will allow typing..
        component.input.dom.blur();

        this.isFocused = true;

        this.showPicker();
    },

    /**
     * Shows the picker for the select field, whether that is a {@link Ext.picker.Picker} or a simple
     * {@link Ext.List list}.
     */
    showPicker: function() {
        var me = this,
            store = me.getOriginalStore(),
            value = me.getValue(),
            cmp = me.getComponent();

        // do nothing if the store is empty
        if ( ! store || store.getCount() === 0 || me.getReadOnly()) {
            return;
        }

        me.isFocused = true;

        var listPanel = me.getPicker(),
            listOptions = me.getListOptions(),
            index, record;

        if (! listPanel.getParent()) {
            Ext.Viewport.add(listPanel);
        }

        if (cmp.isHidden() && me.moreButton) {
            cmp = me.moreButton;
        }

        listPanel.showBy(cmp, null);

        // assign selected items
        if (value) {
            listOptions.select(me.getRecords(), null, true);
        } else {
            listOptions.deselectAll();
        }
    },

    /**
     * Hides the picker
     * @return {Void}
     */
    hidePicker: function() {
        var listPanel = this.listPanel;

        if (listPanel) {
            listPanel.hide({
                type: 'fade',
                out: true,
                scope: this
            });
        }
    },

    // @private
    getPicker: function() {
        var config = this.getPickerConfig();

        if (! this.listPanel) {
            this.listPanel = Ext.create('Ext.Panel', Ext.apply({
                left: 0,
                top: 0,
                modal: true,
                cls: Ext.baseCSSPrefix + 'select-container',
                layout: 'vbox',
                hideOnMaskTap: true,
                width: Ext.os.is.Phone ? '14em' : '18em',
                style: {
                    minWidth: '12em'
                },
                height: (Ext.os.is.BlackBerry && Ext.os.version.getMajor() === 10) ? '12em' : (Ext.os.is.Phone ? '12.5em' : '22em'),
                items: this.getPickerItems()
            }, config));
        }

        return this.listPanel;
    },

    /**
     * The components inside the picker panel.
     * @return {Array} Components
     */
    getPickerItems: function() {

        var items = [
            {
                xtype: 'dataview',
                flex: 1,
                store: this.getStore(),
                itemTpl: '<span class="x-select-option">{' + this.getDisplayField() + ':htmlEncode}</span>',
                emptyText: 'No results found.',
                itemCls: 'x-select-option-item',
                selectedCls: 'x-selected-option',
                pressedCls: 'x-pressed-option',
                mode: this.getMultiple() ? 'MULTI' : 'SINGLE',
                allowDeselect: this.getMultiple() ? true : false,
                listeners: {
                    itemtap: this.onListTap,
                    scope: this
                }
            }
        ];

        if (this.getSearchEnabled()) {
            items.unshift(this.searchTextConfig());
        }
        
        return items;
    },

    /**
     * Search Text configuration.
     * @return {Ext.field.Text}
     */
    searchTextConfig: function() {
        return {
            xtype: 'textfield',
            cls: 'x-select-search',
            labelWidth: 0,
            label: null,
            listeners: {
                clearicontap: this.searchTextClear,
                keyup: this.searchOptionKeyUp,
                scope: this
            }
        };
    },

    /**
     * Get the list from the picker panel.
     * @return {Ext.dataview.Dataview}
     */
    getListOptions: function() {
        var picker = this.getPicker();

        return picker.down('dataview');
    },

    /**
     * Get the search text field from the picker panel.
     * @return {Ext.field.Text}
     */
    getSearchText: function() {
        var picker = this.getPicker();

        return picker.down('textfield');
    },

    /**
     * Resets the store to its original data 
     * when the clear icon from the search text field was tapped.
     * @param  {Ext.field.Text} textfield
     * @param  {Object} e Event object
     * @return {Void}
     */
    searchTextClear: function(textfield, e) {
        this.getListOptions().setStore(this.getOriginalStore());
    },

    /**
     * Called when a user types on the search text.
     * @param  {Ext.field.Text} textfield
     * @param  {Object} e Event object
     * @return {Void}
     */
    searchOptionKeyUp: function(textfield, e) {
        var searchText = textfield.getValue(),
            // make sure that the store to search is the initial store
            storeToSearch = this.getInitialConfig('store'),
            task;

        if ( ! searchText) {
            this.setStore(storeToSearch);
            return;
        }

        task = Ext.create('Ext.util.DelayedTask', this.searchOptions, this, [searchText, storeToSearch]);

        task.delay(this.getSearchDelay());
    },

    /**
     * Perform the search on the store of the list option.
     * @param  {String} searchText Text to search
     * @param  {Ext.data.Store} storeToSearch
     * @return {Undefined|Void}
     */
    searchOptions: function(searchText, storeToSearch) {
        var words, regexps, results, matches,
            me = this;

        storeToSearch = Ext.data.StoreManager.lookup(storeToSearch);

        if ( ! storeToSearch) {
            return;
        }

        // split value to get multiple words;
        words = searchText.split(' ');

        // convert each search string into regex
        regexps = [];

        Ext.each(words, function(word) {

            // Ensure term is not space
            if (word) {
                regexps.push(new RegExp(word, 'i')); // Case-insensitive regex
            }
        });

        results = storeToSearch.queryBy(function(record) {

            matches = [];
            Ext.each(regexps, function(regex) {
                var match = record.get(me.getDisplayField()).match(regex);

                matches.push(match);
            });

            // If nothing was found, return false to not show
            if (regexps.length > 1 && matches.indexOf(false) != -1) {
                return false;
            } else {
                return matches[0];
            }
        });

        me.setStore({
            data: Ext.Array.pluck(results.getRange(), 'data'),
            fields: [me.getValueField(), me.getDisplayField()],
            autoDestroy: true
        });
    },

    // @private
    onListSelect: function(item, record) {
        return;
        var me = this;

        if (me.getMultiple()) {
            me.addRecord(record);
            me.setValue(me.getRecords());
            return;
        }

        me.setValue(record);
    },

    // @private
    onListTap: function(dataview, index, target, record) {
        var me = this;

        me.hidePicker();

        if (me.getMultiple()) {

            if (me.recordExists(record) && dataview.getAllowDeselect()) {
                me.deselectOption(record);
                return;
            }

            me.addRecord(record);
            me.setValue(me.getRecords());
            return;
        }

        me.setValue(record);
    },

    /**
     * De-select a record from the list of options.
     * @param  {Ext.data.Model} record
     * @return {Void}
     */
    deselectOption: function(record) {
        this.removeSelected(record)
        this.removeRecord(record);;
        this.setValue(this.getRecords());
    },

    // @private
    updateSearchEnabled: function(enable) {
        var searchText = this.getSearchText();

        if (enable) {

            if (searchText) return;

            this.getPicker().insert(0, this.searchTextConfig());
        }

        if ( ! enable && searchText) {

            searchText.destroy();
        }
    },

    // @private
    updateMultiple: function(isMultiple) {
        var me = this,
            pickerList = me.getListOptions(),
            input = me.getComponent();

        pickerList.setMode(isMultiple ? 'MULTI' : 'SINGLE');
        pickerList.setAllowDeselect(isMultiple ? true : false);

        me.removeAllSelected();
        me.reset();
        me.hideMoreButton();
        input.show();

        if (isMultiple) {
            me.addResultListener();
            input.setValue(null);
        } else {
            me.results.un({
                scope: me,
                tap: 'onResultsTap'
            });
        }
    },

    // @private
    applyValue: function(value) {
        
        var valueField = this.getValueField(),
            displayField = this.getDisplayField(),
            records = [],
            store, len, i, record;

        //we call this so that the options configruation gets intiailized, so that a store exists, and we can
        //find the correct value
        this.getOptions();

        // get the original store - this will ignore the filtered store
        store = this.getOriginalStore();

        if (value != undefined && store) {

            if ( ! this.getMultiple()) {
                return this.getRecordFromValue(value, store);
           }

            if ( ! Ext.isArray(value)) {
                value = [value];
            }

           for (i = 0, len = value.length; i < len; i++) {

                record = this.getRecordFromValue(value[i], store);

                if (record) {
                    records.push(record);
                }
           }
        }

        return records;
    },

    /**
     * Get the record from the given value
     * @param  {String|Array|Ext.data.Model} value
     * @param  {Ext.data.Store} store
     * @return {Ext.data.Model|null}
     */
    getRecordFromValue: function(value, store) {
        var index,
            valueField = this.getValueField(),
            displayField = this.getDisplayField(),
            record = value;

        if (value && ! value.isModel && store) {

            index = store.find(valueField, value, null, null, null, true);

             if (index == -1) {
                index = store.find(displayField, value, null, null, null, true);
            }

            record = store.getAt(index);
        }

        return record;
    },

    // @private
    updateValue: function(newValue, oldValue) {
        var me = this,
            hasSelection = Ext.baseCSSPrefix + 'has-selection',
            input = this.getComponent(),
            len, i, record;

        if (me.getMultiple() && Ext.isArray(newValue)) {

            me.records = newValue;
            len = newValue.length;

            if (len > 0) {
                me.addCls(hasSelection);
                me.showMoreButton();
            } else {
                me.removeCls(hasSelection);
                me.hideMoreButton();
            }

            for (i = 0; i < len; i++) {
                record = newValue[i];

                if ( ! me.getSelectionElement(record)) {
                    me.createSelectedRecord(record);
                }
            }

        } else {

            me.records = (newValue && ! Ext.isArray(newValue)) ? [newValue] : [];
            me.callParent([(newValue && newValue.isModel) ? newValue.get(me.getDisplayField()) : '']);
        }

    },

    /**
     * Create and show an add more button when the combobox has selection
     * and if multiple selection is allowed.
     * @return {Void}
     */
    showMoreButton: function() {
        var me = this;

        if ( ! me.moreButton) {
            me.moreButton = Ext.Element.create({
                tag: 'button',
                type: 'button',
                cls: Ext.baseCSSPrefix + 'select-add',
                html: me.getAddMoreText()
            });

            me.moreButton.on({
                scope: me,
                tap: 'onMaskTap'
            });

            me.innerElement.appendChild(me.moreButton);
        }

        me.getComponent().hide();
        me.moreButton.show();
    },

    /**
     * Hides the Add more button
     * @return {Void}
     */
    hideMoreButton: function() {
        var me = this;

        if (me.moreButton) {
            me.moreButton.hide();
        }

        me.getComponent().show();
    },

    /**
     * Create an element of the selected record and add it on the results list.
     * @param  {Ext.data.Model} record
     * @return {Void}
     */
    createSelectedRecord: function(record) {
        var config, choice;

        if (this.getSelectionElement(record)) {
            return;
        }

        config = this.createSelectedRecordConfig(record);
        choice = Ext.Element.create(config);

        this.results.dom.insertBefore(choice.dom, this.inputWrapper.dom);
    },

    /**
     * Create the configuration of the selected record for element creation.
     * @param  {Ext.data.Model} record
     * @return {Object} the configuration object
     */
    createSelectedRecordConfig: function(record) {
        var config = {},
            prefix = Ext.baseCSSPrefix,
            valueField = this.getValueField(),
            recordIsModel = record && record.isModel;

        config = {
            tag: 'li',
            cls: prefix + 'select-choice',
            html: '<span class="' + prefix + 'remove-choice">&times;</span>' + (recordIsModel ? record.get(this.getDisplayField()) : record)
        };

        // we need a unique identifier for each selected record
        // this will be used later for removing the element from the dom
        config['data-' + valueField] = recordIsModel ? record.get(valueField) : record;

        return config;
    },

    /**
     * Remove the selected record from the dom.
     * @param  {Ext.data.Model} record
     * @return {Void}
     */
    removeSelected: function(record) {
        var domToRemove = this.getSelectionElement(record);

        if (domToRemove) {
            domToRemove.destroy();
        }
    },

    /**
     * Get the element from the results based on the record provided.
     * @param  {Ext.data.Model} record
     * @return {Object} the object element
     */
    getSelectionElement: function(record) {
        var valueField = this.getValueField(),
            dataSelector;

        dataSelector = '[data-' + valueField + '="' + (record && record.isModel ? record.get(valueField) : record) + '"]';

        return this.results.down(dataSelector);
    },

    /**
     * Remove all selected record from the results.
     * @return {Void}
     */
    removeAllSelected: function() {
        var childrenCount, results, i;

        results = this.results.dom;
        childrenCount = results.childElementCount;

        for (i = 1; i !== childrenCount; i++) {
            results.removeChild(results.firstChild);
        }
    },

    // @override
    getValue: function() {

        var records = this.getRecords();

        if (records.length === 0) {
            this._value = null;
        } else if (this.getMultiple()) {
            this._value = this.getValueFrom(records);
        } else {
            this._value = this.getValueFrom(records[0]);
        }

        return this._value;
    },

    // @override
    setValue: function(newValue) {

        if ( ! this.getMultiple()) {
            return this.callParent(arguments);
        }

        var oldValue = this._value || [],
            changes;

        this.removeAllSelected();
        this.updateValue(this.applyValue(newValue));

        newValue = this.getValue() || [];

        if ( ! this.valuesEqual(newValue, oldValue) && this.initialized) {
            this.onChange(this, newValue, oldValue);
        }

        return this;
    },

    /**
     * @private Check if the new value and old value is equal before firing the 'change' event.
     * @param  {Array} newValue
     * @param  {Array} oldValue
     * @return {Boolean}
     */
    valuesEqual: function(newValue, oldValue) {

        if ( ! Ext.isArray(newValue) || ! Ext.isArray(oldValue)) {
            return newValue == oldValue;
        }

        if (newValue.length != oldValue.length) {
            return false;
        }

        newValue.sort();
        oldValue.sort();

        for (var i = 0, len = newValue.length; i < len; i++) {
            if (newValue[i] != oldValue[i]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Get the value from the given record.
     * This will use the {@link #valueField} when finding the record.
     *
     * @param  {Array} records
     * @return {Ext.data.Model|Array|null}
     */
    getValueFrom: function(records) {
        var valueField = this.getValueField(),
            values = [],
            value, len, i;

        if (Ext.isArray(records)) {
            for (i = 0, len = records.length; i < len; i++) {
                values.push(records[i].get(valueField));
            }

            return values.length ? values : null;
        }

        value = records.get(valueField);

        return value ? value : null;
    },

    /**
     * Add a record to the records array.
     * @param {Ext.data.Model} record
     */
    addRecord: function(record) {

        if ( ! this.recordExists(record)) {
            this.records.push(record);
        }

        return this;
    },

    /**
     * Check if the record exists from the records array.
     * @param  {Ext.data.Model} record
     * @return {Boolean}
     */
    recordExists: function(record) {
        if (this.getRecordIndex(record) === -1) {
            return false;
        }

        return true;
    },

    /**
     * Get the index of the record from the records array.
     * @param  {Ext.data.Model} record
     * @return {Number}
     */
    getRecordIndex: function(record) {
        var records = this.getRecords(),
            valueField = this.getValueField(),
            len = records.length,
            i = 0;

        for (; i < len; i++) {
            if (records[i].get(valueField) === record.get(valueField)) {
                return i;
            }
        }

        return -1;
    },

    /**
     * Remove a record from the records array.
     * @param  {Ext.data.Model} record
     */
    removeRecord: function(record) {
        var index = this.getRecordIndex(record);

        if (index !== -1) {
            this.records.splice(index, 1);
        }
    },

    /**
     * If multiple
     * Returns the current selected {@link Ext.data.Model records} instance selected in this field.
     * @return {array} Ext.data.Model records.
     */
    getRecords: function() {
        return this.records;
    },

    /**
     * If not multiple
     * Returns the current selected {@link Ext.data.Model record} instance selected in this field.
     * @return {Ext.data.Model} the record.
     */
    getRecord: function() {
        return this.records[0] || null;
    },


    // @private
    applyStore: function(store) {
        if (store === true) {
            store = Ext.create('Ext.data.Store', {
                fields: [this.getValueField(), this.getDisplayField()],
                autoDestroy: true
            });
        }

        if (store) {
            store = Ext.data.StoreManager.lookup(store);

            store.on({
                scope: this,
                addrecords: 'onStoreDataChanged',
                removerecords: 'onStoreDataChanged',
                updaterecord: 'onStoreDataChanged',
                refresh: 'onStoreDataChanged'
            });
        }

        return store;
    },

    /**
     * Called when the internal {@link #store}'s data has changed.
     */
    onStoreDataChanged: function(store) {
        var initialConfig = this.getInitialConfig(),
            value = this.getValue();

        if (value || value == 0) {
            this.updateValue(this.applyValue(value));
        }

        if (this.getValue() === null) {
            if (initialConfig.hasOwnProperty('value')) {
                this.setValue(initialConfig.value);
            }

            if (this.getValue() === null && this.getAutoSelect()) {
                if (store.getCount() > 0) {
                    this.setValue(store.getAt(0));
                }
            }
        }
    },

    // @private
    updateStore: function(newStore) {
        if (newStore) {
            this.onStoreDataChanged(newStore);
        }

        if (this.listPanel) {
            this.getListOptions().setStore(newStore);
        }
    },

    /**
     * Get the initial store.
     * @return {Ext.data.Store}
     */
    getOriginalStore: function() {
        return Ext.data.StoreManager.lookup(this.getInitialConfig().store);
    },

    // @private
    getElementConfig: function() {
        var prefix = Ext.baseCSSPrefix;

        return {
            reference: 'element',
            className: 'x-container ' + prefix + 'combobox',
            children: [
                {
                    reference: 'label',
                    cls: prefix + 'form-label',
                    children: [{
                        reference: 'labelspan',
                        tag: 'span'
                    }]
                },
                {
                    reference: 'results',
                    tag: 'ul',
                    classList: [
                        prefix + 'select-results',
                        prefix + 'component-outer'
                    ],
                    children: [
                        {
                            tag: 'li',
                            reference: 'inputWrapper',
                            cls: prefix + 'select-input',
                            children: [{
                                reference: 'innerElement'
                            }]
                        }
                    ]
                }
            ]
        };
    },

    /**
     * Resets the Select field to the value of the first record in the store.
     * @return {Ext.field.Select} this
     * @chainable
     */
    reset: function() {
        var me = this,
            store =  me.getOriginalStore(),
            record;

        if (me.getAutoSelect()) {

            record = (me.originalValue) ? me.originalValue : store.getAt(0);
        } else {

            record = null;
        }

        me.setValue(record);

        if (me.listPanel) {
            var listOptions = me.getListOptions();

            listOptions.setStore(store);
            listOptions.deselectAll();
            me.getSearchText().reset();
            me.hidePicker();
        }

        return me;
    },

    // @override
    destroy: function() {
        this.callParent(arguments);
        var store = this.getStore();

        if (store && store.getAutoDestroy()) {
            Ext.destroy(store);
        }

        Ext.destroy(this.listPanel, this.picker);
    }

});