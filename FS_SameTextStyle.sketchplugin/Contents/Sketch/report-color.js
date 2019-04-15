@import 'share.js';

var onRun = function(context){
    var doc = context.document;
    var page = doc.currentPage();
    var fontSizeCollection = [];

    var a = getAllTextLayer(page.layers());
    fontSizeCollection = seekFontColor(a);
    showPanel(fontSizeCollection);



    function seekFontColor(textLayers){
        var fontColorAry = [];

        for(i in textLayers){
            var item = textLayers[i];
            var itemCol = item.textColor();
            var itemOpa = item.style().contextSettings().opacity();

            if(fontColorAry.length == 0){
                fontColorAry.push( {color:{col:itemCol, opa:itemOpa}, count:1, instances:[item]} )
            }else{
                var targetNoFound = true;
                for(k in fontColorAry){
                    if(fontColorAry[k].color.col.fuzzyIsEqual(itemCol) && fontColorAry[k].color.opa==itemOpa){
                        fontColorAry[k].count ++;
                        targetNoFound = false;
                        fontColorAry[k].instances.push(item);
                        break;
                    }
                }
                if(targetNoFound == true){
                    fontColorAry.push( {color:{col:itemCol, opa:itemOpa}, count:1, instances:[item]} )
                }
            }
        }

        /*fontColorAry.sort(function(a,b){
            console.log(a.color.col.getSaturation())
            if(a.color.col.hue() == b.color.col.hue()){
                if(a.color.col.brightness() == b.color.col.brightness()){
                    if(a.color.col.saturation() == b.color.col.saturation()){
                        return b.color.col.alpha() - a.color.col.alpha();
                    }else{
                        return b.color.col.saturation() - a.color.col.saturation();
                    }
                }else{
                    return b.color.col.brightness() - a.color.col.brightness();
                }
            }else{
                return b.color.col.hue() - a.color.col.hue();
            }
        })
        */

        return fontColorAry;
    }


    function showPanel(infoAry){
        var cellHeight = 40;
        var offsetX = 10;
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
    	fontPanel.title = 'fontColor Usage Report';

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
            var rect = NSView.alloc().initWithFrame(NSMakeRect(offsetX, 10+(i*cellHeight),30,30))
            rect.setBackgroundColor(infoAry[i].color.col.NSColorWithColorSpace(nil))
            var selectText = createDescription(infoAry[i].color.col.treeAsDictionary().value, 22, NSMakeRect(offsetX+30,10+(i*cellHeight),110,30));
            var selectTexts = createDescription('@'+Math.round(infoAry[i].color.opa*100)+'%', 14, NSMakeRect(offsetX+130,17+(i*cellHeight),60,30));
            var numText = createDescription('x'+infoAry[i].count, 14, NSMakeRect(offsetX+190,17+(i*cellHeight),40,30));
            var cb = createCheckBox('Add to Selection', i, false, true, NSMakeRect(offsetX+240,10+(i*40), 130, 30));
            infoAry[i].switchID = i;
            checkBoxAry.push(cb);
            listContent.addSubview(cb);
            listContent.addSubview(rect);
            listContent.addSubview(selectText);
            listContent.addSubview(selectTexts);
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
                        if(infoAry[t].switchID == checkBoxAry[k].tag()){
                            selection = selection.concat(infoAry[t].instances)
                        }
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
        var subTitle = createDescription('Color in use', 14, NSMakeRect(10,308,120,20));
        fontPanel.contentView().addSubview(mainTitle);
        fontPanel.contentView().addSubview(subTitle);
        fontPanel.contentView().addSubview(selectAllButton);
        fontPanel.contentView().addSubview(listView);
    }
}
