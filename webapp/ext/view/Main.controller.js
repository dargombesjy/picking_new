sap.ui.define(
    [
        'sap/fe/core/PageController',
        'sap/m/MessageBox',
        'sap/m/MessageToast'
    ],
    function (PageController, MessageBox, MessageToast) {
        'use strict';

        return PageController.extend('zwmpickingn.ext.view.Main', {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf zwmpickingn.ext.view.Main
             */
            onInit: function () {
                PageController.prototype.onInit.apply(this, arguments); // needs to be called to properly initialize the page controller
                var oUiModel = this.getModel("ui");
                oUiModel.setProperty("/scanActive", false);
                oUiModel.setProperty("/huDisabled", false);
                oUiModel.setProperty("/postEnabled", false);
            },

            /**
             * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
             * (NOT before the first rendering! onInit() is used for that one!).
             * @memberOf zwmpickingn.ext.view.Main
             */
            //  onBeforeRendering: function() {
            //
            //  },

            /**
             * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
             * This hook is the same one that SAPUI5 controls get after being rendered.
             * @memberOf zwmpickingn.ext.view.Main
             */
            //  onAfterRendering: function() {
            //
            //  },

            /**
             * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
             * @memberOf zwmpickingn.ext.view.Main
             */
            //  onExit: function() {
            //
            //  }

            // onSave: function () {
            //     var oTable = this.getView().byId("Table1");
            //     var aContexts = oTable.getSelectedContexts();
            //     this.editFlow.saveDocument(aContexts);
            // },

            // onDiscard: function () {
            //     var oTable = this.getView().byId("Table1");
            //     var aContexts = oTable.getSelectedContexts();
            //     this.editFlow.discardDocument(aContexts);
            // },

            toggleMode: function () {
                var oUiModel = this.getModel('ui');
                // var bIsEditable = oUiModel.getProperty('/isEditable');
                var bScanActive = oUiModel.getProperty('/scanActive');
                var oFilterBar = this.getView().byId("FilterBar");

                oUiModel.setProperty('/scanActive', !bScanActive);
                oUiModel.setProperty('/isEditable', !bScanActive);
                if (!bScanActive) {
                    oFilterBar.setFilterValues("Status", "EQ", "N")
                        .then(function () {
                            return oFilterBar.triggerSearch();
                        });
                }
                oUiModel.setProperty("/postEnabled", true);
            },

            onEdit: function () {
                var oUiModel = this.getModel('ui');
                var bIsEditable = oUiModel.getProperty('/isEditable');
                oUiModel.setProperty('/isEditable', !bIsEditable);
                oUiModel.setProperty("/postEnabled", true);
            },

            onClear: function () {
                this._resetEntryForm("full");
                var oUiModel = this.getModel('ui');
                oUiModel.setProperty('/inProcess', false);
            },

            onNewHU: function (oEvent) {
                var bSelected = oEvent.getParameter("selected");
                var oUiModel = this.getModel('ui');
                oUiModel.setProperty("/huDisabled", bSelected);
            },

            onBarcodeEnter: async function () {
                const sBarcode = this.getView().getModel("barcodeForm").getProperty("/barcodeId");
                if (!sBarcode) {
                    return;
                }
                if (!this._validateEntryForm()) {
                    return;
                }

                const oView = this.getView();
                const oModel = oView.getModel("pickingRef");
                oView.setBusy(true);

                const oListBinding = oModel.bindList("/ZLUT_WM_C_PICKING", undefined, undefined, [
                    new sap.ui.model.Filter("Barcode", sap.ui.model.FilterOperator.EQ, sBarcode)
                ]);

                const that = this;
                oListBinding.requestContexts(0, 1).then(function (aContexts) {

                    if (aContexts.length === 0) {
                        MessageBox.error("No stock data found for Barcode: " + sBarcode);
                        oView.setBusy(false);
                        return;
                    }
                    oView.setBusy(false);
                    that.onAddRow();

                }).catch(function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Search failed: " + oError.message);
                });

                // const oEntryData = this.getView().getModel("barcodeForm").getData();
                // const oModel = this.getView().getModel();
                // const oListBinding = oModel.bindList("/ZLUT_WM_C_PICKING_N");
                // const oNewData = {
                //     Barcode: oEntryData.barcodeId,
                //     Warehouse: oEntryData.warehouse,
                //     HuNum: oEntryData.handlingUnit,
                //     Delivery: oEntryData.delivery,
                //     DelvItem: oEntryData.deliveryItem,
                //     NewHu: oEntryData.newHU === true ? "X" : ""
                // };
                // const oContext = oListBinding.create(oNewData);
                // // const oContext = this.getView().getBindingContext();
                // const oAction = oModel.bindContext("validate_row(...)", oContext);
                // try {
                //     await oAction.execute();
                // } catch (oError) {
                //     MessageToast.show("error");
                // }

                // this.editFlow.invokeAction("com.sap.gateway.srvd.zlut_wm_picking_n.v0001.validate_row", {
                //     contexts: aContexts,
                //     // model: this.getView().getModel(),
                //     // parameterValues: {
                //     //     "Barcode": sBarcode
                //     // },
                //     skipParameterDialog: true
                // }).then(function (oResult) {
                // this.onAddRow();
                // }).catch(function (oError) {
                //     MessageBox.error("An error occurred while validating the barcode: " + oError.message);
                // });
            },

            onBarcodeScanSuccess: function (oEvent) {
                const sBarcode = oEvent.getParameter("text");
                if (sBarcode) {
                    this.getView().getModel("barcodeForm").setProperty("/barcodeId", sBarcode);
                    this.onBarcodeEnter();
                }
            },

            onAddRow: function () {
                const oView = this.getView();
                const oEntryModel = oView.getModel("barcodeForm");
                const oEntryData = oEntryModel.getData();

                const oTable = oView.byId("Table1");
                const oListBinding = oTable.getRowBinding();
                const iCountBefore = oListBinding.getContexts().length;
                const oNewData = {
                    Barcode: oEntryData.barcodeId,
                    Warehouse: oEntryData.warehouse,
                    HuNum: oEntryData.handlingUnit,
                    Delivery: oEntryData.delivery,
                    DelvItem: oEntryData.deliveryItem,
                    NewHu: oEntryData.newHU === true ? "X" : ""
                };

                const oNewContext = oListBinding.create(oNewData);
                const that = this;
                oNewContext.created().then(function () {
                    that._resetEntryForm("partial");
                    var oUiModel = that.getModel('ui');
                    oUiModel.setProperty('/inProcess', true);

                    MessageToast.show("Row added successfully");
                    if (oNewData.HuNum == '') {
                        const oCreatedContext = oNewContext || this._findNewlyAddedContext(oListBinding, iCountBefore);
                        // var oCreatedContext = aContexts.at(oContextToFocus);
                        var oCreatedObject = oCreatedContext.getObject();
                        oEntryModel.setProperty("/handlingUnit", oCreatedObject.HuNum);
                    }
                }).catch(function (oError) {
                    // if (!oNewContext.isDeleted()) {
                    //     oNewContext.delete();
                    // }
                    console.error("Error creating document", oError);
                });

                // var bNewHU = oEntryData.newHU === true ? "X" : "";
                // this.editFlow.createDocument(oListBinding, {
                //     creationMode: "Inline",
                //     data: {
                //         Barcode: oEntryData.barcodeId,
                //         HuNum: oEntryData.handlingUnit,
                //         Delivery: oEntryData.deliveryNumber,
                //         DelvItem: oEntryData.deliveryItem,
                //         NewHu: bNewHU
                //     }
                // }).then(function (oNewContext) {
                //     const oContextToFocus = oNewContext || this._findNewlyAddedContext(oListBinding, iCountBefore);
                //     if (oContextToFocus) {
                //         this._focusNewRow(oTable, oContextToFocus);
                //     }
                // }.bind(this)).catch(function (oError) {
                //     console.error("Error creating document", oError);
                // });
            },

            onGenWHTask: function () {
                var oTable = this.getView().byId("Table1");
                var aContexts = oTable.getSelectedContexts();
                if (!aContexts.length) {
                    MessageToast.show("Select a row first");
                    return;
                }
                
                this.editFlow.invokeAction("com.sap.gateway.srvd.zlut_wm_picking_n.v0001.generate_hu", {
                    contexts: aContexts,
                    // parameterValues: {
                    //     "Action": "GenWHTask"
                    // },
                    skipParameterDialog: true
                });

                MessageBox.information("Data sent for posting. Please continue"), {
                    title: "Post begin"
                }

                var oFilterBar = this.getView().byId("FilterBar");
                oFilterBar.setFilterValues("Status", "NE", "N")
                    .then(function () {
                        return oFilterBar.triggerSearch();
                    });

                var oUiModel = this.getModel("ui");
                oUiModel.setProperty('/isEditable', false);
                oUiModel.setProperty("/postEnabled", false);

                this.onClear();
                // this._resetEntryForm("partial");
                // var oUiModel = this.getModel('ui');
                // oUiModel.setProperty('/inProcess', true);
            },

            _validateEntryForm: function () {
                const oView = this.getView();
                const oFormModel = oView.getModel("barcodeForm");
                const sDelivery = oFormModel.getProperty("/delivery");
                const sDelivItem = oFormModel.getProperty("/deliveryItem");
                if (!sDelivery || !sDelivItem || sDelivery.trim() === "" || sDelivItem.trim() === "") {
                    MessageBox.warning("Please enter both Delivery Number and Delivery Item.");
                    return false;
                }
                // Add more validation logic as needed
                const sBarcode = oFormModel.getProperty("/barcodeId");
                const oTable = oView.byId("Table1");
                const aContexts = oTable.getRowBinding().getContexts();
                const bDuplicate = aContexts.some(function (oContext) {
                    return oContext.getProperty("Barcode") === sBarcode;
                });
                if (bDuplicate) {
                    MessageBox.warning("This barcode has already been added.");
                    return false;
                }
                return true;
            },

            _resetEntryForm: function (sParam) {
                const oView = this.getView();
                const oFormModel = oView.getModel("barcodeForm");

                oFormModel.setProperty("/barcodeId", "");


                if (sParam === "partial") {
                    oFormModel.setProperty("/barcodeId", "");
                } else if (sParam === "full") {
                    oFormModel.setData({
                        barcodeId: "",
                        warehouse: "",
                        deliveryNumber: "",
                        deliveryItem: "",
                        handlingUnit: "",
                        newHU: false,
                    });
                }
            },

            _findNewlyAddedContext: function (oListBinding, iCountBefore) {
                const aContexts = oListBinding.getContexts();
                // transient/new contexts are typically appended; adjust index (0 or last) based on createAtEnd
                return aContexts.length > iCountBefore ? aContexts[aContexts.length - 1] : null;
            },

        });
    }
);
