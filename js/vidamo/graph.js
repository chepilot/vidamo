//
// VIDAMO Graph controller
//

vidamo.controller('graphCtrl', function($scope,prompt,$http) {

    // data structure of procedure list
    $scope.dataList = [];
    // procedure code data structure of procedure list
    $scope.codeList = [];

    // interface data structure of procedure list
    $scope.interfaceList = [];

    // currently selected node ID
    $scope.nodeIndex = '';
    $scope.currentNodeName = '';

    // Selects the next node id.
    var nextNodeID = 0;

    // Setup the data-model for the chart.
    var chartDataModel = {
        nodes: [],
        connections: []
    };

    // store json url
    $scope.graphUrl = '';
    $scope.procedureUrl = '';
    $scope.jsUrl = '';
    $scope.libUrl = '';

    // procedure json
    $scope.procedureJson = '';

    // check for the various File API support.

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        console.log('The File APIs are supported in this browser');
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }


    // open and read json file for graph
    // todo asychronization error need to fix

    $scope.importGraphJson = function(){
        document.getElementById('importGraphJson').click();

        graphJsonObj = null;

        function handleFileSelect(evt) {
            var files = evt.target.files;
            var f = files[0];

            var reader = new FileReader();

            reader.onload = (function () {
                return function (e) {
                    if(f.name.split('.').pop() == 'json'){
                        graphJsonObj = JSON.parse(e.target.result);
                        // update the chart data and view model
                        chartDataModel = graphJsonObj;
                        $scope.chartViewModel = new flowchart.ChartViewModel(chartDataModel);

                        document.getElementById('log').innerHTML += "<div style='color: green'>Graph imported!</div>";

                        if($scope.dataList.length == 0){
                            document.getElementById('log').innerHTML += "<div style='color: green'>Please import procedure too.</div>";
                        }
                    }else{
                        document.getElementById('log').innerHTML += "<div style='color: red'>Error: File type is not Json!</div>";
                    }
                };
            })(f);

            reader.readAsText(f);
        }

        document.getElementById('importGraphJson').addEventListener('change', handleFileSelect, false);
    };


    // open and read json file for procedure
    // todo regenerate graph from procedure json import?
    // todo synchronization error need to fix

    $scope.importProcedureJson = function(){

        document.getElementById('importProcedureJson').click();

        procedureJsonObj = null;

        function handleFileSelect(evt) {
            var files = evt.target.files;
            var f = files[0];

                var reader = new FileReader();

                reader.onload = (function () {
                    return function (e) {
                        if(f.name.split('.').pop() == 'json') {
                            procedureJsonObj = JSON.parse(e.target.result);

                            // update the procedure dataList
                            $scope.dataList = procedureJsonObj;
                            document.getElementById('log').innerHTML += "<div style='color: green'>Procedure imported!</div>";

                            if(chartDataModel.nodes.length == 0){
                                document.getElementById('log').innerHTML += "<div style='color: green'>Please import graph too.</div>";
                            }
                        }else{
                            document.getElementById('log').innerHTML += "<div style='color: red'>Error: File type is not Json!</div>";
                        }
                    };
                })(f);

                reader.readAsText(f);
        }

        document.getElementById('importProcedureJson').addEventListener('change', handleFileSelect, false);
    };


    // save json file for graph

    $scope.exportGraphJson = function(){
        var graphJson = JSON.stringify($scope.chartViewModel.data, null, 4);

        var graphBlob = new Blob([graphJson], {type: "application/json"});

        $scope.graphUrl = URL.createObjectURL(graphBlob);
    }

    // save json file for procedure

    $scope.exportProcedureJson = function(){

        var procedureJson = JSON.stringify($scope.dataList, null, 4);

        //var fullJson = graphJson.concat('\n');
        //var fullJson = fullJson.concat(procedureJson);

        var procedureBlob = new Blob([procedureJson], {type: "application/json"});

        $scope.procedureUrl = URL.createObjectURL(procedureBlob);
    }

    // save js file
    $scope.downloadJs = function(){

        var jsBlob = new Blob([$scope.javascriptCode], {type: "application/javascript"});

        $scope.jsUrl = URL.createObjectURL(jsBlob);
    }

    // save vidamo library file
    $scope.downloadLib = function(){
        $http.get("js/vidamo/module.js")
            .success(
            function(response) {
                var libBlob = new Blob([response], {type: "application/javascript"});
                $scope.libUrl = URL.createObjectURL(libBlob);
            }
        );
    }


    //
    // ------------------------------------- NODE GRAPH -------------------------------------
    //


    // listen to the graph, when a node is clicked, update the visual procedure/ code/ interface accordions

     $scope.$on("nodeIndex", function(event, message) {

         $scope.nodeIndex = message;

         $scope.currentNodeName = $scope.chartViewModel.nodes[$scope.nodeIndex].data.name;

         // update the procedure tab

         $scope.data  = $scope.dataList[$scope.nodeIndex];

         // update the code tab

         $scope.code = $scope.codeList[$scope.nodeIndex];
         $scope.functionCode = $scope.code;

         // update the interface tab

         $scope.interface = $scope.interfaceList[$scope.nodeIndex];
     });




    // verify the function name
    function isValidName(inputName) {
        var testString =  'function ' + inputName  + '(){};';

        try{
            eval(testString);
        }
        catch(err){
            document.getElementById('log').innerHTML += "<div style='color: red'>Error: invalid name!</div>";
            return false;
        }
            return true;
    };

    // Add a new node to the chart.
    $scope.addNewNode = function () {

        // promote for name of new node

        var nodeName = prompt("Enter a node name:", "New node");

        if (!isValidName(nodeName)) {
            return;
        }

        // Template for a new node

        var newNodeDataModel = {
            name: nodeName,
            id: nextNodeID++,
            x: 2200,
            y: 2000,
            inputConnectors: [
            ],
            outputConnectors: [
            ]
        };

        // when new node added, increase the number of procedure list by one

        $scope.dataList.push([]);

        // when new node added, add new code block

        $scope.codeList.push('');

        // when new node added, increase the number of interface list by one

        $scope.interfaceList.push([]);

        $scope.chartViewModel.addNode(newNodeDataModel);

    };

    // Add an input connector to selected nodes.

    $scope.addNewInputConnector = function () {
        var connectorName = prompt("Enter a connector name:", "New connector");

        if (!isValidName(connectorName)) {
            return;
        }

        var selectedNodes = $scope.chartViewModel.getSelectedNodes();

        for (var i = 0; i < selectedNodes.length; ++i) {
            var node = selectedNodes[i];

            node.addInputConnector({
                name: connectorName,
                value:''
            });
        }
    };

    // Add an output connector to selected nodes.

    $scope.addNewOutputConnector = function () {
        var connectorName = prompt("Enter a connector name:", "New connector");

        if (!isValidName(connectorName)) {
            return;
        }

        var selectedNodes = $scope.chartViewModel.getSelectedNodes();
        for (var i = 0; i < selectedNodes.length; ++i) {
            var node = selectedNodes[i];
            node.addOutputConnector({
                name: connectorName,
                value: ""
            });
        }
    };

    // Delete selected nodes and connections in data&view model
    // todo code and interface deletion

    $scope.deleteSelected = function () {
        var deletedNodeIds = $scope.chartViewModel.deleteSelected();

        console.log(deletedNodeIds);

        $scope.dataList.splice(deletedNodeIds[0],1);

        if(deletedNodeIds[0] != ''){
            nextNodeID --;
            console.log($scope.dataList);
        }
    };


    // Create the view-model for the chart and attach to the scope.

    $scope.chartViewModel = new flowchart.ChartViewModel(chartDataModel);

    //
    // ------------------------------------- PROCEDURE GRAPH -------------------------------------
    //

    // watch change of procedure data tree, if change update the flattenData
    $scope.$watch('data', function(){

        // flatten the procedure three for data searching

        var i, l,
            nodes=[],
            visited=[];

        function clone(n) {
            if(n['title'] == 'Data'){
                var props=['id','title','dataName','dataValue','parentNode']
            }
            else if(n['title'] == 'Action'){
                var props=['id','title','dataName','dataValue','parentNode','dataType','method','parameters']
            }
            else if(n['title'] == 'Control'){
                var props=['id','title','controlType','forItemName','parentNode','forList']
            }

            var i,l,
                result={};
            for (i = 0, l = props.length; i < l; i++) {
                if (n[props[i]]) {
                    result[props[i]]= n[props[i]];
                }
            }
            return result;
        }

        function helper (node) {
            var i, limit;
            if (visited.indexOf(node.id) == -1) {
                visited.push(node.id);
                nodes.push(clone(node));
                if( node.nodes) {
                    for (i = 0, limit = node.nodes.length; i < limit; i++) {
                        helper(node.nodes[i]);
                    }
                }
            }
        }
        if($scope.data){
            for (i = 0, l = $scope.data.length; i < l; i++) {
                helper($scope.data[i]);
            }
        }

        // object of flatten procedure data tree
        $scope.flattenData = nodes;
    }, true);




    // procedure manipulation

    $scope.remove = function(scope) {
        scope.remove();
    };

    $scope.toggle = function(scope) {
        scope.toggle();
    };

    $scope.newItem = function(cate) {
        try{
            if(cate == 'Data'){
                $scope.data.push({
                    id: $scope.data.length  + 1,
                    title:  'Data',
                    nodes: [],
                    dataName:'',
                    dataValue:'',
                    parentNode: $scope.chartViewModel.nodes[$scope.nodeIndex].data
                });
            } else if(cate == 'Action'){
                $scope.data.push({
                    id: $scope.data.length  + 1,
                    title:  'Action',
                    nodes: [],

                    // for method name

                    method:'',

                    // for method's arguments

                    parameters:[],

                    // if the method is get data from input port, use following two as holder

                    dataType:'',
                    dataName:'',
                    dataValue:'',
                    parentNode: $scope.chartViewModel.nodes[$scope.nodeIndex].data

                });
            } else if(cate == 'Control'){
                $scope.data.push({
                    id: $scope.data.length  + 1,
                    title:  'Control',
                    nodes: [],
                    controlType: '',
                    forItemName:'',
                    forList:'',
                    parentNode: $scope.chartViewModel.nodes[$scope.nodeIndex].data
                });
            }
        }
        catch(err){
            document.getElementById('log').innerHTML += "<div style='color: red'>Error: no node selected!</div>";
        }

    };

    //onchange write the input value

    $scope.applyValue = function (cate, value,location){
        switch (cate){

            //
            // ----------- cases for data procedure -----------
            //

            case 'dataName':
                location.dataName = value;;
                break;

            case 'dataValue':
                location.dataValue = value;
                break;

            case 'dataType':
                location.dataType = value;
                break;

            //
            // ----------- cases for action procedure -----------
            //

            case 'method':
                location.method = value;
                break;

            // append output method, parameters: 1. output port, 2. dataValue 3. dataName

            case 'outputPort':
                location.parameters[0] = value;
                break;

            case 'outputDataName':
                location.parameters[2] = value;
                break;

            // get input method, parameters: 1. input port index

            case 'inputPort':
                location.parameters[0] = value;
                console.log("input port name:",value);
                break;

            // print data method, parameter: 1. data value 2. data name

            case 'printDataName':
                location.parameters[0] = value;
                break;

            //
            // ----------- control procedure -----------
            //

            case 'controlType':
                location.controlType = value;
                break;

            case 'forItemName':
                location.forItemName  = value;
                break;

            case 'forList':
                location.forList  = value;
                break;

            // ----------- add data to interface ------------
            // parameter0: dataValue parameter1: dataName parameter2: node id

            case 'addToInterface':
                var split = value.split(",");
                console.log("SPLIT1:",split[0]);
                console.log("SPLIT2:",split[1]);
                console.log("SPLIT3:",split[2]);
                location.parameters[0] = split[0];
                location.parameters[1] = split[1];
                location.parameters[2] = split[2]-1;
                break;

            // change data in interface and synchronize with procedure
            // todo when change i won't update directly

            case 'interfaceValue':
                location.parameters[0] = value;
                $scope.data[location.parameters[2]].dataValue = location.parameters[0];
                break;
        }
    };

    // add new item in interface

    $scope.newInterface = function(cate) {

        try{
            if(cate == 'Data'){
                $scope.interface.push({
                    id: $scope.data.length  + 1,
                    title:  'Data',
                    dataName:'',
                    parameters:[],
                    dataValue:'',
                    parentNode: $scope.chartViewModel.nodes[$scope.nodeIndex].data
                });
            }
        }
        catch(err){
            document.getElementById('log').innerHTML += "<div style='color: red'>Error: no node selected!</div>";
        }
    };

    //
    // ------------------------------------- RUN-TIME EXECUTIONS -------------------------------------
    //


    // execute the topological sort, then call procedure functions in sorted order

    $scope.run = function() {

        // declare start running in console

        document.getElementById('log').innerHTML += "<div>Generating code:</br>...</div>";

        // copy the sorted order

        var sortedOrder = $scope.chartViewModel.topoSort().slice();


        //
        // function definitions
        //

        $scope.javascriptCode ='// Function definitions:' + '\n';

        // use flag to check whether it is the first argument

        for(var i = 0; i < $scope.dataList.length; i++){

            // function name

            $scope.javascriptCode += 'function ' + $scope.chartViewModel.nodes[i].data.name +' (';

            $scope.codeList[i]='// Function definitions:' + '\n' + '// This is definition for function '
                                + $scope.chartViewModel.nodes[i].data.name + '\n'
            $scope.codeList[i] = $scope.codeList[i] + 'function ' + $scope.chartViewModel.nodes[i].data.name +' (';

            // function arguments

            var num_input_ports = $scope.chartViewModel.nodes[i].inputConnectors.length;

            if($scope.chartViewModel.nodes[i].inputConnectors.length){

                for(var k = 0; k < num_input_ports; k++){

                    if( k != num_input_ports-1){
                        $scope.javascriptCode += $scope.chartViewModel.nodes[i].inputConnectors[k].data.name
                        + ',';

                        $scope.codeList[i] = $scope.codeList[i]
                        + $scope.chartViewModel.nodes[i].inputConnectors[k].data.name
                        + ',';
                    }
                    else{
                        $scope.javascriptCode += $scope.chartViewModel.nodes[i].inputConnectors[k].data.name;

                        $scope.codeList[i] = $scope.codeList[i]
                        + $scope.chartViewModel.nodes[i].inputConnectors[k].data.name;
                    }
                }

                $scope.javascriptCode +=  '){\n';
                $scope.codeList[i] = $scope.codeList[i]+ '){\n'

            }else{

                $scope.javascriptCode += '){\n';
                $scope.codeList[i] = $scope.codeList[i]  + '){\n';
            }


            // define return items according to output port

            var num_output_ports = $scope.chartViewModel.nodes[i].outputConnectors.length;

            if(num_output_ports){

                for(var k = 0; k < num_output_ports; k++){

                    $scope.javascriptCode += '    var '
                                                + $scope.chartViewModel.nodes[i].outputConnectors[k].data.name
                                                + ';\n';

                    $scope.codeList[i] = $scope.codeList[i]
                    + '    var '
                    + $scope.chartViewModel.nodes[i].outputConnectors[k].data.name
                    + ';\n'
                }

                $scope.javascriptCode +=  '\n';
                $scope.codeList[i] = $scope.codeList[i] + '\n'

            }


            for(var j = 0; j < $scope.dataList[i].length; j++){

                // data procedure

                if($scope.dataList[i][j].title == "Data"){
                    $scope.procedure_data($scope.dataList[i][j],i,false);
                }

                // action procedure

                if($scope.dataList[i][j].title == 'Action'){
                    $scope.procedure_action($scope.dataList[i][j],i,false);
                }


                // control procedure

                if($scope.dataList[i][j].title == 'Control'){
                    $scope.procedure_control($scope.dataList[i][j],i,false);
                }

            }


            // return value

            if(num_output_ports){

                $scope.javascriptCode +=  '\n    return {\n';

                $scope.codeList[i] = $scope.codeList[i]
                + '\n    return {\n';

                for(var k = 0; k < num_output_ports; k++){

                    $scope.javascriptCode +=
                        '        ' + $scope.chartViewModel.nodes[i].outputConnectors[k].data.name
                        + ':'
                        + $scope.chartViewModel.nodes[i].outputConnectors[k].data.name
                        + ',\n';

                    $scope.codeList[i] = $scope.codeList[i]
                    + '        ' + $scope.chartViewModel.nodes[i].outputConnectors[k].data.name
                    + ':'
                    + $scope.chartViewModel.nodes[i].outputConnectors[k].data.name
                    + ',\n'
                }
                $scope.javascriptCode +=  '    };\n' + '}\n\n';
                $scope.codeList[i] = $scope.codeList[i] + '    };\n' + '}\n\n'
            }
            else{
                $scope.javascriptCode +=  '}\n\n';
                $scope.codeList[i] = $scope.codeList[i] + '}\n\n';
            }
        }

        //
        // execution based topological sort
        //

        $scope.javascriptCode += '// execution \n';

        for(var n = 0; n < sortedOrder.length; n++) {

            // case where the node has output
            var output_port_num = $scope.chartViewModel.nodes[sortedOrder[n]].outputConnectors.length;
            var return_obj_name = 'ouput_' + $scope.chartViewModel.nodes[sortedOrder[n]].data.name;

            if (output_port_num != 0) {

                // first get the return object

                $scope.javascriptCode += 'var ' + return_obj_name + ' = ';

            }

            // case where the node has no output
            $scope.javascriptCode += $scope.chartViewModel.nodes[sortedOrder[n]].data.name + "(";

            // print all the parameters/inputs

            var input_port_num = $scope.chartViewModel.nodes[sortedOrder[n]].inputConnectors.length;

            for (var m = 0; m < input_port_num; m++) {

                var input_port_name = $scope.chartViewModel.nodes[sortedOrder[n]].inputConnectors[m].data.name;
                if(m != input_port_num-1){
                    $scope.javascriptCode += input_port_name + ',';
                }
                else{
                    $scope.javascriptCode += input_port_name;
                }

            }

            $scope.javascriptCode +=  ");\n";

            // extract items from return through label
            for(var m =0; m < output_port_num; m++){

                var output_port_name = $scope.chartViewModel.nodes[sortedOrder[n]].outputConnectors[m].data.name;

                for (var l = 0; l < $scope.chartViewModel.connections.length; l++) {

                    if (output_port_name == $scope.chartViewModel.connections[l].source.name()) {

                        var connected_input_name = $scope.chartViewModel.connections[l].dest.data.name;

                        $scope.javascriptCode +=  'var '
                        + connected_input_name +' = '
                        + return_obj_name
                        + '.'
                        + output_port_name + ';\n';
                    }
                }
            }
        }

        document.getElementById('log').innerHTML += "<div> Code generation is done.</div>";
        document.getElementById('log').innerHTML += "<div></br> Execute generated code</div>";

        try{
            eval($scope.javascriptCode);
        }catch (e) {
            document.getElementById('log').innerHTML +=     "<div style='color:red'>" +  e.message + "</div>";
            alert(e.stack);
        }

        document.getElementById('log').innerHTML += "<div> Execution done</div>";
    };

    // data procedure
    $scope.procedure_data = function(procedure,nodeIndex,fromLoop){
        if(fromLoop){
            var intentation = '    ';
        }else{
            var intentation = '';
        }

        if(procedure.title == "Data"){
            if(procedure.dataType == 'var'){
                $scope.javascriptCode += intentation + "    " + "var "
                + procedure.dataName
                + " = '"
                + procedure.dataValue + "';\n";

                $scope.codeList[nodeIndex] += intentation +"    " + "var "
                + procedure.dataName
                + " = '"
                + procedure.dataValue + "';\n";
            }
            else if(procedure.dataType == 'list'){
                $scope.javascriptCode += intentation + "    " + "var "
                + procedure.dataName
                + ' = '
                + '[' ;

                $scope.codeList[nodeIndex] += intentation + "    " + "var "
                + procedure.dataName
                + ' = '
                + '[' ;

                for(var i = 0; i < procedure.dataValue.split(',').length; i++){
                    if(i != procedure.dataValue.split(',').length -1){
                        $scope.javascriptCode += "'" + procedure.dataValue.split(',')[i]  + "',";
                        $scope.codeList[nodeIndex] += "'" + procedure.dataValue.split(',')[i]  + "',";
                    }else if(i == procedure.dataValue.split(',').length-1){
                        $scope.javascriptCode += "'" + procedure.dataValue.split(',')[i]  + "'";
                        $scope.codeList[nodeIndex] += "'" + procedure.dataValue.split(',')[i]  + "'";
                    }
                }
                $scope.javascriptCode +=  '];\n';
                $scope.codeList[nodeIndex] +=  '];\n';
            }

        }
    }

    // action procedure
    $scope.procedure_action = function(procedure,nodeIndex,fromLoop){

        if(fromLoop){
            var intentation = '    ';
        }else{
            var intentation = '';
        }

        // action: get data from input port
        if(procedure.method == 'get input'){

            $scope.javascriptCode += intentation  + '    ' + 'var '
            + procedure.dataName + ' = '
            + procedure.parameters[0] + ';\n'

            $scope.codeList[nodeIndex] += intentation  + '    ' + 'var '
            + procedure.dataName + ' = '
            + procedure.parameters[0] + ';\n'
        }

        // action: print data
        if(procedure.method == 'print data'){
            $scope.javascriptCode +=  intentation  + '    ' + 'VIDAMO.print_data('
            + procedure.parameters[0] + ');\n'

            $scope.codeList[nodeIndex] += intentation + '    ' + 'VIDAMO.print_data('
            + procedure.parameters[0] + ');\n'
        }

        // action: append data to output port
        if(procedure.method == 'append output'){

            $scope.javascriptCode += intentation + '    '
            + procedure.parameters[0]
            + ' = '
            + procedure.parameters[2] + ';\n';

            $scope.codeList[nodeIndex] += intentation + '    '
            + procedure.parameters[0]
            + ' = '
            + procedure.parameters[2] + ';\n';
        }
    }

    // control procedure
    $scope.procedure_control = function(procedure,nodeIndex,fromLoop){
        if(fromLoop){
            var intentation = '    ';
        }else{
            var intentation = '';
        }
        $scope.javascriptCode +=  intentation + '    ' + 'for( var ' +
        procedure.forItemName + ' of '
        + procedure.forList + '){\n';

        $scope.codeList[nodeIndex] +=  intentation + '    ' + 'for( var ' +
        procedure.forItemName + ' of '
        + procedure.forList + '){\n';

        if(procedure.nodes.length > 0){
            for(var m = 0; m < procedure.nodes.length; m++){
                if(procedure.nodes[m].title == 'Action'){$scope.procedure_action(procedure.nodes[m],nodeIndex,true)}
                if(procedure.nodes[m].title == 'Data'){$scope.procedure_data(procedure.nodes[m],nodeIndex,true)}
                if(procedure.nodes[m].title == 'Control'){$scope.procedure_control(procedure.nodes[m],nodeIndex,true)}
            }
        }
        $scope.javascriptCode += intentation + '    }\n'
        $scope.codeList[nodeIndex] += intentation + '    }\n'
    }

});



