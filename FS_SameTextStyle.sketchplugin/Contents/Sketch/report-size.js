@import 'share.js';

var onRun = function(context){
    var doc = context.document;
    var page = doc.currentPage();
    var fontSizeCollection = [];

    var a = getAllTextLayer(page.layers());
    fontSizeCollection = seekFontSize(a);
    showPanel(fontSizeCollection);



    function seekFontSize(textLayers){
        var fontSizeAry = [];

        for(i in textLayers){
            item = textLayers[i];
            if(fontSizeAry.length == 0){
                fontSizeAry.push( {size:Number(item.fontSize()), count:1, instances:[item]} )
            }else{
                var targetNoFound = true;
                for(k in fontSizeAry){
                    if(fontSizeAry[k].size == item.fontSize()){
                        fontSizeAry[k].count ++;
                        targetNoFound = false;
                        fontSizeAry[k].instances.push(item);
                        break;
                    }
                }
                if(targetNoFound == true){
                    fontSizeAry.push( {size:Number(item.fontSize()), count:1, instances:[item]} )
                }
            }
        }

        fontSizeAry.sort(function(a,b){return a.size-b.size;})

        return fontSizeAry;
    }


    function showPanel(infoAry){
        var cellHeight = 40;
        var fontPanel = NSPanel.alloc().init();
        var checkBoxAry = [];

    	fontPanel.setFrame_display(NSMakeRect(0,0,400,400),true);
    	//fontPanel.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSFullSizeContentViewWindowMask);
    	//fontPanel.setBackgroundColor(NSColor.controlColor());
    	fontPanel.setLevel(NSFloatingWindowLevel);
    	fontPanel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    	fontPanel.standardWindowButton(NSWindowZoomButton).setHidden(true);
    	fontPanel.makeKeyAndOrderFront(null);
    	fontPanel.center();
    	fontPanel.title = 'fontSize Usage Report';

    	COScript.currentCOScript().setShouldKeepAround_(true);

        var threadDictionary = NSThread.mainThread().threadDictionary(),
    		identifier = "com.freeman.sketchplugins.fs-report";

    	if (threadDictionary[identifier]) return;

    	threadDictionary[identifier] = fontPanel;

    	var closeButton = fontPanel.standardWindowButton(NSWindowCloseButton);

    	closeButton.setCOSJSTargetFunction(function(sender) {
    		fontPanel.close();
    		threadDictionary.removeObjectForKey(identifier);
    		COScript.currentCOScript().setShouldKeepAround_(false);
    	});

        var listView = NSScrollView.alloc().initWithFrame(NSMakeRect(0,0,400,300));
        listView.setFlipped(1);
        listView.setHasVerticalScroller(true);

        var listContent = NSView.alloc().initWithFrame(NSMakeRect(0,0,400,infoAry.length*cellHeight));
        listContent.setFlipped(1);
        for(var i=0; i<infoAry.length; i++){
            var selectText = createDescription(infoAry[i].size+'pt', 22, NSMakeRect(10,10+(i*cellHeight),70,30));
            var numText = createDescription('x'+infoAry[i].count, 14, NSMakeRect(100,17+(i*cellHeight),40,30));
            var cb = createCheckBox(/*infoAry[i].size+'pt'*/'Add to Selection', infoAry[i].size, false, true, NSMakeRect(150,10+(i*40), 130, 30))
            checkBoxAry.push(cb);
            listContent.addSubview(cb);
            listContent.addSubview(selectText);
            listContent.addSubview(numText);
        }
        listView.addSubview(listContent)
        listView.setDocumentView(listContent)


        var selectAllButton = NSButton.alloc().initWithFrame(NSMakeRect(150, 300, 130, 36));
        selectAllButton.setTitle("Select Textlayers");
        selectAllButton.setBezelStyle(NSRoundedBezelStyle);
        selectAllButton.setAction("callAction:");
        selectAllButton.setCOSJSTargetFunction(function(sender) {
            var selection = [];
            for(k in checkBoxAry){
                //checkbox.state() & checkbox.tag()
                if(checkBoxAry[k].state()){
                    for(t in infoAry){
                        if(infoAry[t].size == checkBoxAry[k].tag())
                        selection = selection.concat(infoAry[t].instances)
                    }
                }
            }
            //console.log(selection.length)
            context.document.currentPage().changeSelectionBySelectingLayers(nil);
            selection.forEach(function(item,index){
                item.select_byExpandingSelection(true,true);
            })
        });

        var mainTitle = createDescription(infoAry.length+'', 48, NSMakeRect(10,328,120,48));
        var subTitle = createDescription('font-size in use', 14, NSMakeRect(10,308,120,20));
        fontPanel.contentView().addSubview(mainTitle);
        fontPanel.contentView().addSubview(subTitle);
        fontPanel.contentView().addSubview(selectAllButton);
        fontPanel.contentView().addSubview(listView);
    }


}
