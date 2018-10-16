
var xx = 1539187201001;
//保存cpu状态的变量
var dcpu=[];
dcpu.push({
    x: 0,
    y: 0
});
//cpu的定时器
var tcpu;
//时间，最大，总和
var cput=0,maxcpu=0,sumcpu=0;
//保存内存状态的变量
var dmem=[];
dmem.push({
    x: 0,
    y: 0
});
var tmem;
var memt=0,maxmem=0,summem=0;

//保存流量状态的变量
var dflowu=[];
dflowu.push({
    x: 0,
    y: 0
});
var tflow;
var flowt=0,maxflowu=0,sumflowu=0;

var dflowd=[];
dflowd.push({
    x: 0,
    y: 0
});
var maxflowd=0,sumflowd=0;

//获取设备名字
function getdevices(){
    document.getElementById("refresh").disabled = true;
    var r = op.getdevices();
    if(r=="error no adb command" || r=="error device not found"){
        showmsg(r);
        document.getElementById("monitor").disabled = true;
        document.getElementById("run").disabled = true;
        document.getElementById("stop").disabled = true;
    }else{
        var device = r.split(";");
        var html = "";
        for (i=0;i<device.length;i++){
            html += "<option value=\""+device[i]+"\">" + device[i] + "</option>";
        }
        document.getElementById("devices").innerHTML = html;
        document.getElementById("monitor").disabled = false;
        document.getElementById("run").disabled = false;
        document.getElementById("stop").disabled = false;
    }
    document.getElementById("refresh").disabled = false;
}

//开始监控
function monitor(){
    document.getElementById("monitor").disabled = true;
    if ( tcpu != undefined || tmem != undefined || tflow != undefined)
        return;
    //初始化状态
    op.initmonitor();
    $('#container').highcharts().series[0].update({data:[0]})
    $('#container1').highcharts().series[0].update({data:[0]})
    $('#container2').highcharts().series[0].update({data:[0]})
    $('#container2').highcharts().series[1].update({data:[0]})
    cput = 0,maxcpu=0,sumcpu=0,dcpu=[];
    dcpu.push({
        x: 0,
        y: 0
    });
    memt=0,maxmem=0,summem=0,dmem=[];
    dmem.push({
        x: 0,
        y: 0
    });

    var params = $('#rundatas').serialize();
    params = decodeURIComponent(params);
    var reg = new RegExp( '\\+' , "g" )
    params = params.replace(reg,' ');
    op.initparam(params);
    var net = op.getnet();


    tcpu = window.setInterval(function()
    {
        getcpu();
    }, 990);

    tmem = window.setInterval(function()
    {
        getmem();
    }, 990);

    tflow = window.setInterval(function()
    {
        getflow();
    }, 990);
}

//开始监控
var isrun = 0;
var trun;

function runtest(){

    if(isrun==0){
        stopmonitor();
        document.getElementById("monitor").disabled = true;
        document.getElementById("run").disabled = true;

        //初始化状态
        op.initmonitor();
        $('#container').highcharts().series[0].update({data:[0]})
        $('#container1').highcharts().series[0].update({data:[0]})
        $('#container2').highcharts().series[0].update({data:[0]})
        $('#container2').highcharts().series[1].update({data:[0]})
        cput = 0,maxcpu=0,sumcpu=0,dcpu=[];
        dcpu.push({
            x: 0,
            y: 0
        });
        memt=0,maxmem=0,summem=0,dmem=[];
        dmem.push({
            x: 0,
            y: 0
        });

        var params = $('#rundatas').serialize();
        params = decodeURIComponent(params);
        var reg = new RegExp( '\\+' , "g" )
        params = params.replace(reg,' ');
        op.initparam(params);
        op.mokeyrunner();

        tcpu = window.setInterval(function()
        {
            getcpu();
        }, 990);

        tmem = window.setInterval(function()
        {
            getmem();
        }, 990);

        tflow = window.setInterval(function()
        {
            getflow();
        }, 990);

        trun = window.setInterval(function()
        {
            res = op.isruning();
            if(res=="0"){
                runfinish();
            }
        }, 5000);
    }else{
        showmsg("正在运行...")
    }
}

//定时获取cpu
function getcpu(){
    var res = op.monitorcpu();
    if(res=="-1"){
        return;
    }
    if(res.indexOf('error')>=0){
        showmsg(res);
//        clearTimeout(tcpu);
//        tcpu = undefined;
        return;
    }
    //刷新显示
    var y =0;
    try{
        y = parseInt(res);
    }catch(err){
        //在这里处理错误
    }
    if(y>maxcpu){
        maxcpu=y;
    }
    sumcpu+=y;
    $('#container').highcharts().series[0].addPoint([xx+cput, y], true, false)
    cput+=1000;
    document.getElementById("cpudata").innerText = "平均值："+parseInt(sumcpu*100000/cput)/100+" | 最大值："+ maxcpu + " (单位%)";
}

//定时获取内存
function getmem(){
    var res = op.monitormem();
    if(res=="-1"){
        return;
    }
    if(res.indexOf('error')>=0 ){
        showmsg(res);
//        clearTimeout(tmem);
//        tmem = undefined;
        return;
    }
    //刷新显示
    var y =0;
    try{
        y = parseInt(res);
    }catch(err){
        //在这里处理错误
    }
    if(y>maxmem){
        maxmem=y;
    }
    summem+=y;
    $('#container1').highcharts().series[0].addPoint([xx+memt, parseInt(y*100/1024)/100], true, false)
    memt+=1000;
    document.getElementById("memdata").innerText = "平均值："+parseInt(summem*100000/memt/1024)/100+" | 最大值："+ parseInt(maxmem*100/1024)/100 + " (单位M)";
}

//定时获取流量
function getflow(){
    var res = op.monitorflow();
    if(res=="-1"){
        return;
    }
    if(res.indexOf('error')>=0 ){
        showmsg(res);
//        clearTimeout(tflow);
//        tflow = undefined;
        return;
    }



    //刷新显示
    var y1 =0,y2=0;
    var flows = res.split(";");
    try{
        y1 = parseInt(flows[0]);
        if (y1>15728640){
            y1=0;
        }
    }catch(err){
        //在这里处理错误
    }
    if(y1>maxflowu){
        maxflowu=y1;
    }

    try{
        y2 = parseInt(flows[1]);
        if (y2>15728640){
            y2=0;
        }
    }catch(err){
        //在这里处理错误
    }
    if(y2>maxflowd){
        maxflowd=y2;
    }
    sumflowu+=y1;
    sumflowd+=y2;
    $('#container2').highcharts().series[0].addPoint([xx+flowt, parseInt(y1*100/1024)/100], true, false)
    $('#container2').highcharts().series[1].addPoint([xx+flowt, parseInt(y2*100/1024)/100], true, false)
    flowt+=1000;
    document.getElementById("flowdata").innerText = "上行：avg:"+parseInt(sumflowu*10000/flowt/1024)/10+" max:"+ parseInt(maxflowu*10/1024)/10 + " sum:" + parseInt(sumflowu*10/1024)/10 +" (kb/s) | 下行：avg:"+parseInt(sumflowd*10000/flowt/1024)/10+" max:"+ parseInt(maxflowd*10/1024)/10 + " sum:" + parseInt(sumflowd*10/1024)/10 +" (kb/s)";
}

//运行完成
function runfinish(){
    clearTimeout(tcpu);
    clearTimeout(tmem);
    clearTimeout(tflow);
    clearTimeout(trun);
    cput=0;
    memt=0;
    flowt=0;
    tcpu = undefined;
    tmem = undefined;
    tflow = undefined;
    trun = undefined;
    document.getElementById("monitor").disabled = false;
    document.getElementById("run").disabled = false;
    alert("测试完成");
}

//停止监控
function stopmonitor(){
    clearTimeout(tcpu);
    clearTimeout(tmem);
    clearTimeout(tflow);
    cput=0;
    memt=0;
    flowt=0;
    tcpu = undefined;
    tmem = undefined;
    tflow = undefined;
    document.getElementById("monitor").disabled = false;
}

//提示区域
var tshow;

function showmsg(str){
    if(tshow != undefined){
        window.clearInterval(tshow);
        tshow = undefined;
    }
    document.getElementById('show').innerHTML=str;
    document.getElementById('show').style.display = "block";
    var div=document.getElementById('show');
    div.style.opacity=1;
    hidden(document.getElementById("show"),1,-0.01);
}
function hidden(o,i,s){
    tshow=setInterval(function(){
    i+=s;
    o.style.opacity=i;
    if(i<0.2){
        window.clearInterval(tshow);
        tshow = undefined;
        document.getElementById('show').style.display = "none";
    }
    },20);
};

$(function () {
$(document).ready(function() {
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
    document.getElementById('show').style.opacity=0;
    document.getElementById('show').style.display = "none";
    getdevices();

    var chart;
    $('#container').highcharts({
        chart: {
            type: 'spline',
            animation: Highcharts.svg, // don't animate in old IE
            marginRight: 10,
            events: {
                load: function() {

                    // set up the updating of the chart each second
                    var s = this.series[0];

                    var x = 1539187201000, // current time
                        y = 0;
                    s.addPoint([x, y], true, true);
                }
            }
        },
        title: {
            text: null
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 100,
        },
        yAxis: {
            min: 0,
            title: {
                text: 'CPU动态走势图--每1秒'
            },

            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
         plotOptions: {
                spline: {
                    lineWidth: 1,
                states: {
                        hover: {
                            lineWidth: 2
                        }
                    },
                    marker: {
                        enabled: false
                        //radius: 10
                    },
                    pointInterval: 3600000, // one hour
                    pointStart: Date.UTC(2009, 0, 0, 0, 0, 0)
                }
            },

        tooltip: {
            formatter: function() {
                    return '<b>'+ this.series.name +'</b><br/>'+
                    Highcharts.dateFormat('%H:%M:%S', this.x) +'<br/>'+
                    Highcharts.numberFormat(this.y, 2);
            }
        },

        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        series: [{
            name: '占用率',
            data: dcpu
        }]
    });
    });
});


$(function () {
$(document).ready(function() {
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    var chart;
    $('#container1').highcharts({
        chart: {
            type: 'spline',
            animation: Highcharts.svg, // don't animate in old IE
            marginRight: 10,
            events: {
                load: function() {

                    // set up the updating of the chart each second
                    var s = this.series[0];

                    var x = 1539187201000, // current time
                        y = 0;
                    s.addPoint([x, y], true, true);
                }
            }
        },
        title: {
            text: null
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 100,
        },
        yAxis: {
            min: 0,
            title: {
                text: '内存动态走势图--每1秒'
            },

            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
         plotOptions: {
                spline: {
                    lineWidth: 1,
                states: {
                        hover: {
                            lineWidth: 2
                        }
                    },
                    marker: {
                        enabled: false
                        //radius: 10
                    },
                    pointInterval: 3600000, // one hour
                    pointStart: Date.UTC(2009, 0, 0, 0, 0, 0)
                }
            },

        tooltip: {
            formatter: function() {
                    return '<b>'+ this.series.name +'</b><br/>'+
                    Highcharts.dateFormat('%H:%M:%S', this.x) +'<br/>'+
                    Highcharts.numberFormat(this.y, 2);
            }
        },

        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        series: [{
            name: '占用率',
            data: dmem
        }]
    });
    });
});

$(function () {
$(document).ready(function() {
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    var chart;
    $('#container2').highcharts({
        chart: {
            type: 'spline',
            animation: Highcharts.svg, // don't animate in old IE
            marginRight: 10,
            events: {
                load: function() {

                    // set up the updating of the chart each second
                    var s = this.series[0];

                    var x = 1539187201000, // current time
                        y = 0;
                    s.addPoint([x, y], true, true);
                    this.series[1].addPoint([x, y], true, true);
                }
            }
        },
        title: {
            text: null
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 100,
        },
        yAxis: {
            min: 0,
            title: {
                text: '网络动态走势图--每1秒'
            },

            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
         plotOptions: {
                spline: {
                    lineWidth: 1,
                states: {
                        hover: {
                            lineWidth: 2
                        }
                    },
                    marker: {
                        enabled: false
                        //radius: 10
                    },
                    pointInterval: 3600000, // one hour
                    pointStart: Date.UTC(2009, 0, 0, 0, 0, 0)
                }
            },

        tooltip: {
            formatter: function() {
                    return '<b>'+ this.series.name +'</b><br/>'+
                    Highcharts.dateFormat('%H:%M:%S', this.x) +'<br/>'+
                    Highcharts.numberFormat(this.y, 2);
            }
        },

        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        series: [{
            name: '上传速度',
            data: dflowu
        },{
            name: '下载速度',
            data: dflowd
        },]
    });
    });
});
