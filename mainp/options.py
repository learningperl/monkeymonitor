# coding:utf8

import htmlPy
import os, time, threading


class op(htmlPy.Object):
    isrun = False
    cpu = '-1'
    mem = '-1'
    flowu = -1
    flowd = -1
    fu = -1
    fd = -1
    params = {}
    net = 'wlan0'
    keys = ['touch', 'motion', 'pinchzoom', 'trackball', 'rotation', 'nav', 'syskeys', 'appswitch', 'flip', 'anyevent',
            'majornav']

    # @htmlPy.Slot(arg1_type, arg2_type, ..., result=return_type)
    @htmlPy.Slot(str, result=str)
    def say_hello_world(self, arg1):
        print("say_hello_world" + arg1)
        # self.app.html = "Hello, world"
        return "123"

    # 获取设备名字
    @htmlPy.Slot(result=str)
    def getdevices(self):
        # print("getdevices")
        me = os.popen('adb devices').read().split('\n')
        # print(me)
        str = ''
        if me.__len__() == 1:
            str = 'error no adb command'
        else:
            for i in range(1, me.__len__()):
                s = me[i]
                if s.find('device') > 0:
                    s = s[0:s.index('\t')]
                    str += s + ';'

            if str == '':
                str = 'error device not found'
            else:
                str = str[0:str.__len__() - 1]

        return str

    # 初始化监控参数
    @htmlPy.Slot(result=str)
    def initmonitor(self):
        self.cpu = '-1'
        self.mem = '-1'
        self.flowu = -1
        self.flowd = -1
        self.fu = -1
        self.fd = -1
        self.net = 'wlan0'
        return '1'

    # 初始化客户端监控和运行参数
    @htmlPy.Slot(str, result=str)
    def initparam(self, arg1):
        # print("initparam" + arg1)
        arg = str(arg1)
        res = ''
        self.params = {}
        if len(arg) > 0:
            try:
                p1 = arg.split('&')
                for p2 in p1:
                    if len(p2) > 0:
                        p3 = p2.split('=')
                        if len(p3) > 0:
                            self.params[p3[0]] = p3[1]
            except:
                res = "cpu:error params"
                return res
        else:
            res = "cpu:error params"
            return res

        # print(self.params)

    # 获取CPU占用率
    @htmlPy.Slot(result=str)
    def monitorcpu(self):
        # print("monitorcpu")

        try:
            if self.params['devicename'] == "请选择" or self.params['package'] == "":
                res = "cpu:error params"
                return res
            else:
                def runcpu(self, p):
                    cmd = 'adb -s ' + self.params['devicename'] + ' shell top -n 1 -d 1| findstr ' + self.params[
                        'package']
                    re_cpu = os.popen(cmd).read().split()
                    if len(re_cpu) == 0:
                        self.cpu = 'cpu:error app not exist'
                    else:
                        c = 0
                        for s in re_cpu:
                            if s.find('%') > 0:
                                s = s[0:s.__len__() - 1]
                                try:
                                    c += int(s)
                                except:
                                    pass

                        self.cpu = str(c)

                th = threading.Thread(target=runcpu, args=(self, self.params))
                th.start()
                return self.cpu

        except:
            res = "cpu:error params"
            return res

    # 获取实际使用内存
    @htmlPy.Slot(result=str)
    def monitormem(self):
        # print("monitormem")

        try:
            if self.params['devicename'] == "请选择" or self.params['package'] == "":
                res = "mem:error params"
                return res
            else:
                def runmem(self, p):
                    cmd = 'adb -s ' + self.params['devicename'] + ' shell dumpsys  meminfo ' + self.params['package']

                    re_mem = os.popen(cmd).read().split()
                    # print(re_mem)
                    if re_mem.__len__() < 100:
                        self.mem = "mem:error app not eixst"
                        return

                    for i in range(100, len(re_mem)):
                        if re_mem[i] == 'TOTAL':
                            self.mem = re_mem[i + 1]
                            return

                th = threading.Thread(target=runmem, args=(self, self.params))
                th.start()
                return self.mem

        except Exception as e:
            print(e)
            res = "mem:error params"
            return res

    # 获取当前手机联网方式，默认wlan0
    @htmlPy.Slot(result=str)
    def getnet(self):
        # print("getnet")

        try:
            if self.params['devicename'] == "请选择" or self.params['package'] == "":
                res = "net:error params"
                return res
            else:
                cmd = 'adb -s ' + self.params['devicename'] + ' shell ifconfig | findstr Link'
                re_net = os.popen(cmd).read().split('\n')
                if re_net == None or len(re_net) < 2:
                    self.net = 'wlan0'
                else:
                    for i in range(0, len(re_net)):
                        if re_net[i].find('Scope: Link') > 0:
                            s = re_net[i - 1].split()
                            if s[0].find('dummy') >= 0:
                                pass
                            else:
                                if s[0].find('0') >= 0:
                                    self.net = s[0]

                self.net = 'wlan0'
                print('当前联网网卡' + self.net)

                cmd = 'adb -s ' + self.params['devicename'] + ' shell ps | findstr ' + self.params['package']
                flowup = 0
                flowdown = 0
                res_ps = os.popen(cmd).read().split('\n')
                if len(res_ps.__str__()) < 10:
                    res = "net:error app not exist"
                    return res

                # print(res_ps)
                ps1 = res_ps[0]
                if ps1.__len__() > 1:
                    ps = ps1.split()
                    cmd = 'adb -s ' + self.params['devicename'] + ' shell cat /proc/' + ps[
                        1] + '/net/dev | findstr ' + self.net
                    re_flow = os.popen(cmd).read().split()
                    try:
                        flowdown += int(re_flow[1])
                    except:
                        pass

                    try:
                        flowup += int(re_flow[9])
                    except:
                        pass
                self.flowd = flowdown
                self.flowu = flowup
                return str(self.flowd)

        except Exception as e:
            print(e)
            res = "net:error params e"
            return res

    # 获取网络流量的上行和下行
    @htmlPy.Slot(result=str)
    def monitorflow(self):
        # print("monitorflow")

        try:
            if self.params['devicename'] == "请选择" or self.params['package'] == "":
                res = "flow:error params"
                return res
            else:
                cmd = 'adb -s ' + self.params['devicename'] + ' shell ps | findstr ' + self.params['package']
                res_ps = os.popen(cmd).read().split('\n')
                # print(res_ps)
                if len(res_ps.__str__()) < 10:
                    res = "net:error app not exist"
                    return res
                else:
                    def runflow(self, res_ps):
                        flowup = 0
                        flowdown = 0
                        ps1 = res_ps[0]
                        if ps1.__len__() > 1:
                            ps = ps1.split()
                            cmd = 'adb -s ' + self.params['devicename'] + ' shell cat /proc/' + ps[
                                1] + '/net/dev | findstr ' + self.net
                            re_flow = os.popen(cmd).read().split()
                            try:
                                flowdown += int(re_flow[1])
                            except:
                                pass

                            try:
                                flowup += int(re_flow[9])
                            except:
                                pass

                        self.fd = flowdown - self.flowd
                        self.fu = flowup - self.flowu
                        self.flowd = flowdown
                        self.flowu = flowup
                        return

                    th = threading.Thread(target=runflow, args=(self, res_ps))
                    th.start()
                    # print(str(self.fu) + ';' + str(self.fd))
                    return str(self.fu) + ';' + str(self.fd)

        except Exception as e:
            print(e)
            res = "mem:error params"
            return res

    # 运行monkey测试
    @htmlPy.Slot(result=str)
    def mokeyrunner(self):
        # print("mokeyrunner")

        try:
            if self.params['devicename'] == "请选择" or self.params['package'] == "":
                res = "flow:error params"
                return res
            else:
                cmd = 'adb -s ' + self.params['devicename'] + ' shell monkey -p ' + self.params['package'] + ' -s ' + \
                      self.params[
                          'seed'] + ' --throttle ' + self.params['throttle'] + ' ' + self.params['other']

                def getevent(self, key):
                    if self.params[key] == '':
                        return ''
                    else:
                        try:
                            per = int(self.params[key])
                            return '--pct-' + key + ' ' + self.params[key]
                        except:
                            print('--pct-' + key + ' 的值不为整数')
                            return ''

                for k in self.keys:
                    c = getevent(self, k)
                    if not c == '':
                        cmd += ' ' + c

                cmd += ' ' + self.params['level'] + ' ' + self.params['sumevent']
                print(cmd)

                def runmonkey(self, cmd):
                    self.isrun = True
                    log = os.popen(cmd)
                    fh = open(self.params['logpath'], 'w')
                    fh.write(log.read().__str__())
                    fh.close()
                    self.isrun = False

                th = threading.Thread(target=runmonkey, args=(self, cmd))
                th.start()
                time.sleep(1)
                return '1'

        except Exception as e:
            print(e)
            res = "mem:error params"
            return res

    # 检测是否运行完成
    @htmlPy.Slot(result=str)
    def isruning(self):
        # print("isrun")
        if self.isrun:
            return '1'
        else:
            return '0'
