var sourceArray = [];
var elementArray = [];
var chains = [];
var sorceNumber = 0;

document.getElementById("startEmulationButton").onclick = function(e){

    chains = [];

    for(var i = 0; i < sourceArray.length; i++){

        if(sourceArray[i] != undefined){
            elementArray = new Array(elementNumber).fill(0);
            sorceNumber = sourceArray[i].number;
            findWays(sourceArray[i].points[0], undefined, [{type:"source", voltage:sourceArray[i].voltage, haveEditableElements:false}], true);
        }
    }

    console.log(chains);

    emulate();

}

function findWays(lastPoint, lastWire, str, firstStart){

    var point;

    if(!firstStart){

        elementArray[lastPoint.parentElement.number]++;

        if(lastPoint.parentElement.type == "source" && lastPoint.parentElement.number == sorceNumber){

            //console.log(str[0]["haveEditableElements"]);
            if(lastPoint.inElementNumber == 2 && str[0]["haveEditableElements"]==true)chains[chains.length] = str;
            return;

        }

        var params = undefined;

        switch (lastPoint.parentElement.type) {
            case "transistor":

                if(lastPoint.inElementNumber == 3  || elementArray[lastPoint.parentElement.number] > 2)return;
                point = lastPoint.parentElement.points[2];
                if(lastPoint.inElementNumber == 2)str[0]["haveEditableElements"] = true;
                params = {"input": (lastPoint.inElementNumber == 2 ? 2 : 1)};
                break;

            case "switch":

                if(elementArray[lastPoint.parentElement.number] > 1 ||
                   !lastPoint.parentElement.isOn)return;
                point = lastPoint.parentElement.points[0].number == lastPoint.number ? lastPoint.parentElement.points[1] : lastPoint.parentElement.points[0];
                break;

            case "resistor":
                if(elementArray[lastPoint.parentElement.number] > 1)return;
                point = lastPoint.parentElement.points[0].number == lastPoint.number ? lastPoint.parentElement.points[1] : lastPoint.parentElement.points[0];
                break;

            default:
                if(lastPoint.parentElement.type=="led-diode")str[0]["haveEditableElements"] = true;
                if(lastPoint.inElementNumber == 2 || elementArray[lastPoint.parentElement.number] > 1)return;
                point = lastPoint.parentElement.points[1];
                break;
        }

        str[str.length] = {"element":point.parentElement,"type":point.parentElement.type, "point1inElementNumber":lastPoint.inElementNumber, "point2inElementNumber":point.inElementNumber};
        if(params != undefined)str[str.length-1]["params"] = params;

    }else{

        point = lastPoint;

    }

    var nowElementArray = elementArray.slice();

    for(var i = 0; i < point.dependedWires.length; i++){

        if(point.dependedWires[i] != undefined && 
          (lastWire == undefined || lastWire.number != point.dependedWires[i].number)){

            elementArray = nowElementArray.slice();
            
            findWays(point.dependedWires[i].parentPoint1.number == point.number ? point.dependedWires[i].parentPoint2 : point.dependedWires[i].parentPoint1 , point.dependedWires[i], str.slice());

        }

    }}

function emulate(){

    var smthChanged;

    do{

        smthChanged = false;
        for (var i = 0; i < chains.length; i++) {

            //the beginning of part of code for each chain

            var chainParams = learnChainParams(i);
            //chainParams:
            //  #voltage
            //  #amperage
            //  #resistance
            //  #baseTransistors
            //  #collectorTransistors
            //  #led-diodes

            if(i == 0){
                for(var i = 0; i < chainParams["baseTransistors"].length; i++){

                    chainParams["baseTransistors"][i].element.nowAmperage = 0;
                    chainParams["baseTransistors"][i].element.openValue = 0;

                }

                for(var i = 0; i < chainParams["led-diodes"].length; i++){

                    chainParams["led-diodes"][i].element.nowAmperage = 0;
                    chainParams["led-diodes"][i].element.lightLevel = 0;

                }
            }

            console.log(chainParams["amperage"]);

            for(var i = 0; i < chainParams["baseTransistors"].length; i++){

                chainParams["baseTransistors"].element.nowAmperage += chainParams["amperage"];

            }
            for(var i = 0; i < chainParams["led-diodes"].length; i++){

                chainParams["led-diodes"].element.nowAmperage += chainParams["amperage"];

            }

            if(i == chains.length-1){

                //recount params

            }

            //the ending of part of code for each chain

        }

    }while(smthChanged);
}

function learnChainParams(chainNumber) {
    
    var paramsArray = {"voltage": chains[chainNumber][0]["voltage"], "resistance": 0, "collectorTransistors": [], "baseTransistors": [], "led-diodes": []};

    for (var i = 1; i < chains[chainNumber].length; i++) {

        switch(chains[chainNumber][i].type){

            case "resistor":
                paramsArray["resistance"] += chains[chainNumber][i].element.resistance;
                break;

            case "transistor":
                paramsArray[(chains[chainNumber][i].params.input == 1 ? "collector" : "base")+"Transistors"][paramsArray[(chains[chainNumber][i].params.input == 1 ? "collector" : "base")+"Transistors"].length] = chains[chainNumber][i];
                break;

            case "led-diode":
                paramsArray["led-diodes"][paramsArray["led-diodes"].length] = chains[chainNumber][i];
                paramsArray["resistance"] += 0.1;
                break;
        }

    }

    if(paramsArray["voltage"] == 0)paramsArray["amperage"] = 0;
    else if(paramsArray["resistance"] == 0 && paramsArray["voltage"] != 0)paramsArray["amperage"] = Infinity;
    else paramsArray["amperage"] = paramsArray["voltage"] / 1.0 / paramsArray["resistance"];
    for (var i = 0; i < paramsArray["collectorTransistors"].length; i++) {
        paramsArray["amperage"]*=paramsArray["collectorTransistors"][i].params["openValuePer100"] / 100;
    }

    return paramsArray;}