function getAllTextLayer(group){
    var textLayers = [];

    for(var i=0; i<group.count(); i++){
        if(group[i].isKindOfClass(MSTextLayer)){
            textLayers.push(group[i]);
        }else if(group[i].isKindOfClass(MSPage)){
            textLayers = textLayers.concat(getAllTextLayer(group[i].layers()));
        }else if(group[i].isKindOfClass(MSArtboardGroup)){
            textLayers = textLayers.concat(getAllTextLayer(group[i].layers()));
        }else if(group[i].isKindOfClass(MSLayerGroup)){
            textLayers = textLayers.concat(getAllTextLayer(group[i].layers()));
        }
    }

    return textLayers;
}


function createDescription(text,size,frame,alpha) {
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

function createCheckBox(name,value,onstate,enabled,frame){
    var checkbox = NSButton.alloc().initWithFrame(frame);
    checkbox.setButtonType(NSSwitchButton);
    //checkbox.setBezelStyle(1);
    checkbox.setTitle(name);
    checkbox.setTag(value);
    checkbox.setState(onstate ? NSOnState : NSOffState);
    checkbox.setEnabled(enabled);

    return checkbox;
}
