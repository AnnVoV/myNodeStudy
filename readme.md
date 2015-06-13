## 1.Node.js 学习目录   
  #### [(1)gulp-seajs-combo插件的使帮助我们合并seajs文件](https://github.com/AnnVoV/myNodeStudy/tree/seajs)  
  #### [(2)seajs with handlebars 的使用]


## 2.前端脚本写法学习  
#### 学习qin 同学的写法 非常棒 主要也运用MVC的思想
#### demo:
````
/**
* 申请额度--住房公积金
* @date: 15-05-07
* @author qin
*/
'use strict';
define(function(require,exports,module){
  var $ = require('jquery'),
      Check = require('check'),
      delBtnControl = require('delBtnControl'),
      Mbox = require('mbox');

  var Hide = 'f-hide';
  var tokenstr = DATA.token;
  var loanApplyId = DATA.loanApplyId;

  var dom = {
      agree: $('.j-agreement'),
      agreebox: $('.j-agreebox'),
      returnbtn: $('.j-return'),
      mainbox: $('.j-mainbox'),
      locationSelect: $('.j-fundlist'),
      accountCon: $('.j-account'),
      passwordCon: $('.j-password'),
      submitBtn: $('.j-submit'),
      TypeTplCon: $('.j-methodsel'),
      GZTpl: $('.j-sel1'),
      BJTpl: $('.j-sel2')
  }

  var pageModel = {
      fundCode: '',
      account: dom.accountCon.val(),
      password: dom.passwordCon.val(),
      loginWayGZ: '',
      verifyWayBJ: '',
      isChecked: true
  };

  var pageController = {
    init:function(){
      dom
        .locationSelect
        .trigger('change');
    },
    register:function(){
      registerLocate();

      var submitBtn = dom.submitBtn;

      //tips提示
      tips();

      //btn取消disabled样式
      $('input').on('blur',function(){
          if (validate()) {
            submitBtn.addClass('on');
          }else{
            submitBtn.removeClass('on');
          };
      });

      //同意用户协议
      $('.j-agree').on('click',function(){
        if (validate()) {
          submitBtn.addClass('on');
        }else{
          submitBtn.removeClass('on');
        };
      });

      //提交
      submit();
    },
    render:function(selectValue){
      pageView.showFundType(selectValue);
    },
    changePlaceholder:function(wrap){
      wrap.on('change',function(){
        dom.accountCon.val('');
        dom.accountCon.attr('placeholder','请输入' + $(this).find(':checked').text());
      });
    }
  };

  var pageView = {
    showFundType:function(fundCode){
      var TypeTplCon = dom.TypeTplCon,
          GZTpl = dom.GZTpl,
          BJTpl = dom.BJTpl,
          wrap;

      if(fundCode != 'ZJ_HZ_001' && fundCode != 'SH_SH_001'){
        if (fundCode == 'GZ_GZ_001') {
          wrap = GZTpl;
          TypeTplCon.addClass(Hide);
          // 广州公积金（暂时只有一种）
          // GZTpl.removeClass(Hide);
          // BJTpl.addClass(Hide);
        }else{
          TypeTplCon.removeClass(Hide);
          wrap = BJTpl;
          GZTpl.addClass(Hide);
          BJTpl.removeClass(Hide);
        };
        pageController.changePlaceholder(wrap);
        wrap.trigger('change');
      }else{
        TypeTplCon.addClass(Hide);
        dom.accountCon.attr('placeholder','请输入公积金账号');
      }
    }
  };

  //注册更新公积金地
  function registerLocate(){
    var con = dom.locationSelect;
    con.on('click',function(){
      con.css('color','#333');
    });
    con.on('change', function() {
      var selectValue = $(this).val();
      pageModel.fundCode = selectValue;
      pageController.render(selectValue);
    });
  };

  //验证表单的值
  function validate(){
    var isChecked = true;

    //验证input非空
    $('input').each(function(index,el){
      if (!$(el).val()) {
        isChecked = false;
      };
    });

    //用户协议checkbox
    if (!$('.j-agree').is(':checked')) {
      isChecked = false;
    };

    //验证身份证号码
    if (pageModel.fundCode == 'BJ_BJ_001' && dom.BJTpl.find(':checked').val() == 2) { 
      var IDno = dom.accountCon;
      if (IDno.val()!='' && !Check.check('isIDno',IDno.val())) {
        Mbox.toast('身份证号码输入有误，请重新输入');
        IDno.val('');
        isChecked = false;
      };
      pageModel.account = IDno.val();
    };
    return isChecked
  };

  //表单提交
  function submit(){
    var submitBtn = dom.submitBtn;
    submitBtn.on('click',function(){
      if (validate()) {
        var data = {
          gongjijinTypCode: pageModel.fundCode,
          gongjijinNo: $('.j-account').val(),
          gongjijinPwd: $('.j-password').val(),
          loanApplyId:loanApplyId
        }
        if (pageModel.fundCode == 'GZ_GZ_001') {
          data.loginWayGZ = dom.GZTpl.find(':checked').val();
        }else if(pageModel.fundCode == 'BJ_BJ_001'){
          data.verifyWayBJ = dom.BJTpl.find(':checked').val();
        };
        $.ajax({
            url:'/limit/apply/applyFund?_csrf='+ tokenstr,
            type:'post',
            data:data,
            success:function(data){
              var code = data.code;
              tokenstr = data._csrf;
              if (code=='0') {
                var id = data.loanApplyId || DATA.loanApplyId;
                window.location="/limit/apply/listApplyItems?loanApplyId=" + id;
              }else{
                Mbox.toast( data.msg || '请求错误，请再次提交');
              };
            },
            error:function(){
              console && console.log('error');
              window.location.reload();
            }
        });
      };
    });
  };

  //公积金tips
  function tips(){

    //如何获取公积金
    var qbox = new Mbox({
        trigger: $(".j-fundtips"), //trigger
        titleCls:"tips-title",  //title自定义样式
        contCls: 'tips-text', //内容样式
        width: '230px', //弹框宽度
        title: '提示',
        content: "如何获知公积金的认证方法？请至网易小贷网页端官网-帮助中心-公积金指引，查看引导说明。",
        backable: false,
        closeable: true
    });

    //用户协议
    dom.agree.on('click',function(){
      dom.agreebox.removeClass(Hide);
      dom.mainbox.addClass(Hide);
    });
    dom.returnbtn.on('click',function(){
      dom.agreebox.addClass(Hide);
      dom.mainbox.removeClass(Hide);
    });

  };

  var main = function(){
    //删除按钮的显示控制与清空控制
    delBtnControl.controlHandler();
    pageController.register();
    pageController.init();
  };
  main();

});
````
