const sketch = require('sketch')

// ============================================================
// - Main Starter
// ============================================================
function runSelector() {
    const doc = sketch.getSelectedDocument()
    const pages = doc.pages
    let textList = []
    let colorList = []

    for(let p of pages){
        textList = textList.concat(loopSeachText(p))
    }

    colorList = getTextColorList(textList)
    sizeList = getFontSizeList(textList)

    showPanel([colorList, sizeList])
}

function loopSeachText (container) {
    let results = []
    for(let layer of container.layers){
      switch(layer.type){
        case 'Artboard':
        case 'Group':
        case 'SymbolMaster':
            results = results.concat(loopSeachText(layer))
          break
        case 'Text':
            results.push(layer)
          break
        default:
          //Do Nothing
      }
    }

    return results
}

function getTextColorList(textlayers){
    let list = []
    let ignoreFill = null


    for(let tLayer of textlayers){
        let tCol = tLayer.style.textColor
        let tOpa = Number(tLayer.style.opacity.toFixed(2))
        let tFill = false

        //Layer has fill style
        if(layerHasFillOn(tLayer)){
            if(ignoreFill === null){
                sketch.UI.getInputFromUser('One or more textlayer has FILL on, which will affect the results of color statistics, What shall we do?',{
                    type: sketch.UI.INPUT_TYPE.selection,
                    possibleValues:['List their text-color(Might different from look)','Ignore them']
                },(err,value)=>{
                    if (err) {
                        ignoreFill = false
                    }
                    if(value === 'List their text-color(Might different from look)'){
                        ignoreFill = false
                    }else{
                        ignoreFill = true
                    }
                })
            }

            if(ignoreFill){
                //Skip this layer loop
                break
            }else{
                tCol = getTopMostFill(tLayer).color
                tFill = true
            }
        }

        //Start regiester layer's font-color and opacity
        if(list.length === 0){
            list.push({
                color: tCol,
                opacity: tOpa,
                filled: tFill,
                instances: [tLayer]
            })
        }else{
            let styleFound = false
            for(let s of list){
                if(s.color === tCol && s.opacity === tOpa && s.filled === tFill){
                    s.instances.push(tLayer)
                    styleFound = true
                    break
                }
            }
            if(!styleFound){
                list.push({
                    color: tCol,
                    opacity: tOpa,
                    filled: tFill,
                    instances: [tLayer]
                })
            }
        }
    }

    list.sort((a,b)=>{
        const ca = hexToHSL(a.color)
        const cb = hexToHSL(b.color)
        if(ca.h === cb.h){
            return a.opacity > b.opacity ? -1 : 1
        }else{
            return ca.h-cb.h
        }
    })

    return list
}

function getFontSizeList(textlayers){
    let list = []
    //Regiester layer's font-color and opacity
    for(let tLayer of textlayers){
        const tSize = tLayer.style.fontSize

        if(list.length === 0){
            list.push({
                size: tSize,
                instances: [tLayer]
            })
        }else{
            let styleFound = false
            for(let s of list){
                if(s.size === tSize){
                    s.instances.push(tLayer)
                    styleFound = true
                    break
                }
            }
            if(!styleFound){
                list.push({
                    size: tSize,
                    instances: [tLayer]
                })
            }
        }
    }

    list.sort((a,b)=>{
        return a.size - b.size
    })

    return list
}

function showPanel(dataLists){
    const winWidth = 400
    const winHeight = 400
    const panelKeys = ['color','size']
    let panelId = 0

    let fontPanel = NSPanel.alloc().init();

    fontPanel.setFrame_display(NSMakeRect(0, 0, winWidth, winHeight),true);
    //fontPanel.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSFullSizeContentViewWindowMask);
    //fontPanel.setBackgroundColor(NSColor.controlColor());
    fontPanel.setLevel(NSFloatingWindowLevel);
    fontPanel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    fontPanel.standardWindowButton(NSWindowZoomButton).setHidden(true);
    fontPanel.makeKeyAndOrderFront(null);
    fontPanel.center();
    fontPanel.title = 'Text Styles';

    COScript.currentCOScript().setShouldKeepAround_(true);
    //Thread, Identifier staff...
    var threadDictionary = NSThread.mainThread().threadDictionary(),
        identifier = "com.freeman.sketchplugins.fs-textlayer-select";
    if (threadDictionary[identifier]) return;
    threadDictionary[identifier] = fontPanel;

    var closeButton = fontPanel.standardWindowButton(NSWindowCloseButton);
    closeButton.setCOSJSTargetFunction(function(sender) {
        fontPanel.close();
        threadDictionary.removeObjectForKey(identifier);
        COScript.currentCOScript().setShouldKeepAround_(false);
    });

    //Actual content panel, swithced by segmented contorl
    let contentPanel = NSView.alloc().initWithFrame(NSMakeRect(0, 0, winWidth, winHeight-59))
    addPanelContentToView(panelKeys[panelId], dataLists[panelId], contentPanel)
    //contentPanel.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(0.1, 0.2, 0.3, 1))

    //Main segmented control
    let segControl = NSSegmentedControl.alloc().initWithFrame(NSMakeRect((winWidth-300)/2, winHeight-44-15, 300, 22))
    const segItems = ['Color','Font-Size']
    segControl.setSegmentCount(segItems.length);
    segItems.forEach((item,index)=>{
        segControl.setLabel_forSegment(item, index);
		segControl.setWidth_forSegment(0, index);
    })
    segControl.cell().setTrackingMode(0); //Raw value of NSSegmentSwitchTrackingSelectOne.
    segControl.setSelected_forSegment(true, 0);
    segControl.cell().setAction('callAction:')
    segControl.cell().setCOSJSTargetFunction(function(sender){
        //Switch Panel
        panelId = sender.indexOfSelectedItem()
        while(contentPanel.subviews().count() > 0){
            contentPanel.subviews()[0].removeFromSuperview()
        }
        addPanelContentToView(panelKeys[panelId], dataLists[panelId], contentPanel)
    })

    fontPanel.contentView().addSubview(contentPanel)
    fontPanel.contentView().addSubview(segControl)
}


function createLabel(text, size, frame, alpha) {
    var label = NSTextField.alloc().initWithFrame(frame),
        alpha = (alpha) ? alpha : 1.0;

    label.setStringValue(text);
    label.setFont(NSFont.systemFontOfSize(size));
    //label.setTextColor(NSColor.colorWithCalibratedRed_green_blue_alpha(255/255, 255/255, 255/255, alpha));
    label.setBezeled(false);
    label.setDrawsBackground(false);
    label.setEditable(false);
    label.setSelectable(false);

    return label;
}

function addPanelContentToView(panelKey, dataList, targetView){
    const viewWidth = targetView.frame().size.width
    const viewHeight = targetView.frame().size.height
    const cellHeight = 40
    const barMax = 160
    const offsetX = 10
    let checkBoxAry = []
    let mainNumLable = ''

    let instanceCalc = {numMax:0, numMin:0, insNums:[]}
        
    for(let style of dataList){
        instanceCalc.insNums.push(style.instances.length)
    }
    instanceCalc.insNums.sort((c,d)=>{return d-c})
    instanceCalc.numMax = instanceCalc.insNums[0]
    instanceCalc.numMin = instanceCalc.insNums[instanceCalc.insNums.length-1]

    //The main list
    let listView = NSScrollView.alloc().initWithFrame(NSMakeRect(0, 0, viewWidth, viewHeight-80));
    listView.setFlipped(1);
    listView.setHasVerticalScroller(true);

    let listContent = NSView.alloc().initWithFrame(NSMakeRect(0, 0, viewWidth, dataList.length*cellHeight));
    listContent.setFlipped(1);

    if(panelKey === 'color'){
        mainNumLable = 'Color sets in use'

        for(var i=0; i<dataList.length; i++){
            //Color Bar
            const barWidth = barMax*dataList[i].instances.length/instanceCalc.numMax
            var bar = NSView.alloc().initWithFrame(NSMakeRect(barMax-barWidth+viewWidth-barMax-2, 10+(i*cellHeight-4), barWidth, 38))
            bar.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(1,1,1,0.05))
            //Color Preview
            var colorPreview = NSView.alloc().initWithFrame(NSMakeRect(offsetX, 10+(i*cellHeight),30,30))
            
            colorPreview.setBackgroundColor(hexAToRGBA(dataList[i].color))
            //Color HEX value
            var colorHex = createLabel(
                dataList[i].color.slice(0,7).toLocaleUpperCase(),
                22, 
                NSMakeRect(offsetX+30, 10+(i*cellHeight), 110, 30)
            );
            //Color Opacty value
            var opaValue = createLabel(
                '@'+Math.round(dataList[i].opacity*100)+'%',
                14,
                NSMakeRect(offsetX+130, 17+(i*cellHeight), 60, 30)
            );
            //Number of instances
            var numText = createLabel(
                'x'+dataList[i].instances.length,
                14,
                NSMakeRect(offsetX+190, 17+(i*cellHeight), 40, 30)
            );
            //'Add to Selection' chekcbox
            var cb = createCheckBox('Add to Selection', i, false, true, NSMakeRect(offsetX+240,10+(i*40), 130, 30));
            dataList[i].switchID = i;
            checkBoxAry.push(cb);
    
            listContent.addSubview(bar)
            listContent.addSubview(cb)
            listContent.addSubview(colorPreview)
            listContent.addSubview(colorHex)
            listContent.addSubview(opaValue)
            listContent.addSubview(numText)
            if(dataList[i].filled){
                let fillTag = createLabel(
                    'FILL',
                    9,
                    NSMakeRect(offsetX, 10+(i*cellHeight), 24, 12)
                );

                let bg = NSView.alloc().initWithFrame(NSMakeRect(offsetX, 10+(i*cellHeight), 24, 12))
                fillTag.setTextColor(hexAToRGBA('#000000FF'))
                bg.setBackgroundColor(hexAToRGBA('#FFAB2FFF'))
                //fillTag.setBackgroundColor(hexAToRGBA('#FFAB2FFF'))
                listContent.addSubview(bg)
                listContent.addSubview(fillTag)
            }
        }

        //List Content Ready for 'Color'
    }else if(panelKey === 'size'){
        mainNumLable = 'Font sizes in use'

        for(var i=0; i<dataList.length; i++){
            //Color Bar
            const barWidth = barMax*dataList[i].instances.length/instanceCalc.numMax
            var bar = NSView.alloc().initWithFrame(NSMakeRect(barMax-barWidth+viewWidth-barMax-2, 10+(i*cellHeight-4), barWidth, 38))
            bar.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(1,1,1,0.05))

            //Color HEX value
            var sizeValue = createLabel(
                String(dataList[i].size),
                22, 
                NSMakeRect(offsetX, 10+(i*cellHeight), 110, 30)
            )

            var sizeUnit = createLabel(
                'px',
                12, 
                NSMakeRect(offsetX+30, 17+(i*cellHeight), 110, 30)
            )
            
            //Number of instances
            var numText = createLabel(
                'x'+dataList[i].instances.length,
                14,
                NSMakeRect(offsetX+190, 17+(i*cellHeight), 40, 30)
            );
            //'Add to Selection' chekcbox
            var cb = createCheckBox('Add to Selection', i, false, true, NSMakeRect(offsetX+240,10+(i*40), 130, 30));
            dataList[i].switchID = i;
            checkBoxAry.push(cb);
    
            listContent.addSubview(bar)
            listContent.addSubview(cb)
            listContent.addSubview(sizeValue)
            listContent.addSubview(sizeUnit)
            listContent.addSubview(numText)
        }

        //List Content Ready for 'Size'
    }

    listView.addSubview(listContent)
    listView.setDocumentView(listContent)

    var selectAllButton = NSButton.alloc().initWithFrame(NSMakeRect(viewWidth-130, viewHeight-80, 130, 36));
    selectAllButton.setTitle("Select Textlayers");
    selectAllButton.setBezelStyle(NSRoundedBezelStyle);
    selectAllButton.setAction("callAction:");
    selectAllButton.setCOSJSTargetFunction(function(sender) {
        //Add selected layers to selection
        var selection = [];
        for(k in checkBoxAry){
            //checkbox.state() & checkbox.tag()
            if(checkBoxAry[k].state()){
                for(t in dataList){
                    if(dataList[t].switchID == checkBoxAry[k].tag()){
                        selection = selection.concat(dataList[t].instances)
                    }
                }
            }
        }

        let docSelection = sketch.getSelectedDocument().selectedLayers
        docSelection.clear()
        docSelection.layers = selection
    });

    let mainNumber = createLabel(dataList.length+'', 48, NSMakeRect(10, viewHeight-50, 120, 48))
    let numberTitle = createLabel(mainNumLable, 12, NSMakeRect(10 ,viewHeight-72, 120, 20))

    targetView.addSubview(mainNumber)
    targetView.addSubview(numberTitle)
    targetView.addSubview(selectAllButton)
    targetView.addSubview(listView)
}


function createCheckBox(name, value, onstate, enabled, frame){
    var checkbox = NSButton.alloc().initWithFrame(frame);
    checkbox.setButtonType(NSSwitchButton);
    //checkbox.setBezelStyle(1);
    checkbox.setTitle(name);
    checkbox.setTag(value);
    checkbox.setState(onstate ? NSOnState : NSOffState);
    checkbox.setEnabled(enabled);

    return checkbox;
}

// ============================================================
// - Utility Functions
// ============================================================

function layerHasFillOn(layer){
    if(layer.style.fills.length > 0){
        let hasEnabled = false
        for(let f of layer.style.fills){
            if(f.enabled){
                hasEnabled = true
                break
            }
        }
        return hasEnabled
    }else{
        return false
    }
}

function getTopMostFill(layer){
    let topMostFill
    for(let f of layer.style.fills){
        if(f.enabled){
            topMostFill = f
        }
    }
    return topMostFill
}


function hexAToRGBA(h) {
    let r = 0, g = 0, b = 0, a = 1;
  
    if (h.length == 5) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];
      a = "0x" + h[4] + h[4];
  
    } else if (h.length == 9) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
      a = "0x" + h[7] + h[8];
    }
    a = +(a / 255).toFixed(3);
    //return "rgba(" + +r + "," + +g + "," + +b + "," + a + ")";
    return NSColor.colorWithRed_green_blue_alpha(Number(r)/255, Number(g)/255, Number(b)/255,a*255)
}

function hexToHSL(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
      r = parseInt(result[1], 16);
      g = parseInt(result[2], 16);
      b = parseInt(result[3], 16);
      r /= 255, g /= 255, b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;
      if(max == min){
        h = s = 0; // achromatic
      }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
    var HSL = new Object();
    HSL['h']=h;
    HSL['s']=s;
    HSL['l']=l;
    return HSL;
  }