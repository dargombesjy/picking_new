sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"zwmpickingn/test/integration/pages/ZLUT_WM_C_PICKING_NMain.gen"
], function (JourneyRunner, ZLUT_WM_C_PICKING_NMainGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('zwmpickingn') + '/test/flp.html#app-preview',
        pages: {
			onTheZLUT_WM_C_PICKING_NMainGenerated: ZLUT_WM_C_PICKING_NMainGenerated
        },
        async: true
    });

    return runner;
});

