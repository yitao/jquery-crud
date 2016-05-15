/**
 * 增删改查框架v0.0.1
 * 依赖 jquery , jquery-easyui , jquery-dataform , layer, echarts
 * 初始创建
 * 实现功能：
 * 1.框架搭建
 * 2.数据表格绘制
 * 3.表单绘制
 * v.0.0.2 功能设计
 * 1. 增加布局方式
 * 2. 增加数据网格和表单之间的 伸缩bar
 * 3. 控制 数据网格 和 表单 显示
 * 4. echarts 控件 (后续)
 */

(function($, layer, window, document, undefined){
	function __requestData(self,url,param,callback,error){
		$.ajax({
			url:url,
			type:"post",
			data:param,
			success:function(json){
				callback(self,json);
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){
				error(self, XMLHttpRequest, textStatus, errorThrown);
			}
		});
	}
//	包裹 div , 只用 id 或者 class
	function __wrapDiv(id,classes){
		var div = document.createElement("div");
		div.id= id;
		div.className = classes.join(" ");
		return div;
	}
	
//	默认配置
	$.crud = {
			defaults:{
				queryFirst:true,//是否初始查询
				title:null,//标题
				Id : "crud_"+new Date().getTime(),
				Model:"lr",//lr:左右结构 ， tb:上下结构
				idKey:"_id",//作为参数传递的key值，比如说删除
				dataId:"_id",//从datagrid中获取的key值
				addUrl:"../../admin/addfadealertype",
				deleteUrl:"../../admin/deletefadealertype",
				updateUrl:"../../admin/updatefadealertype",
				queryUrl:"../../admin/queryfadealertype",
				datagrid:{//datagrid 默认配置
					rownumbers:true,
					singleSelect:true
				},
				dataform:{//dataform 默认配置
				},
				cascade:{
					id : "_id",
					fid : "_fid",
					url : "../../admin/querydealertypebyfid"
				}
			}
	};
//	增删改查框架
	function CRUD(ele,options){
		var id = new Date().getTime();
		this.ele = ele;
		this.$ele = $(ele);
		this.options = $.extend(true,{},$.crud.defaults,options);
		this.Container = {};
		this.Container.width = this.$ele.width();
		this.Container.height = this.$ele.height();
		this.crud_id = "CRUD_"+id;
		this.grid_id = "GRID_"+id;
		this.form_id = "FORM_"+id;
		this.renderUI();
		if(this.options.queryFirst){
			this.queryData();
		}
		return this;
	}
//	渲染 执行 方法
	CRUD.prototype.renderUI = function(){
		var container = __wrapDiv(this.crud_id,["crud_panel"]);
		container.style.width=this.Container.width+"px";
		container.style.height=this.Container.height+"px";
		container.style.backgroundColor="#eee";
		if(this.options.title!=null){
			var title = __wrapDiv("",[]);
			title.innerHTML = this.options.title;
			$(container).append(title);
		}
		var grid = __wrapDiv(this.grid_id,["crud_datagrid_panel"]);
		grid.style.width=this.Container.width+"px";
		grid.style.height=this.Container.height/2+"px";
		var form = __wrapDiv(this.form_id,["crud_dataform_panel"]);
		form.style.width=this.Container.width+"px";
		form.style.height=this.Container.height/2+"px";
		this.$ele.append(container);
		$(container).append(grid);
		$(container).append(form);
		this.renderDataGridUI();
		this.renderDataFormUI();
	}
	
//	渲染数据网格
	CRUD.prototype.renderDataGridUI = function(){
		this.options.datagrid.crud=this;
		this.options.datagrid.onSelect=this.selectDataRow;
		this.options.datagrid.toolbar=[{
			text:"",
			iconCls: 'icon-add',
			handler: this.toAddData
		},'-',{
			text:"",
			iconCls: 'icon-edit',
			handler: this.toUpdateData
		},'-',{
			text:"",
			iconCls: 'icon-remove',
			handler: this.toDeleteData
		}];
		this.DataGrid =  $('#'+this.grid_id).datagrid(this.options.datagrid);
		$(this.DataGrid).datagrid("resize",{height:400});
	}
	
//	数据网格行数据 选择 
	CRUD.prototype.selectDataRow = function(rowIndex,rowData){
		var opt = $(this).datagrid('options');
		self = opt.crud;
		self.DataForm.disableAll();
		self.rowIndex = rowIndex;
		self.rowData = rowData;
		self.renderDataFormData(rowData);
		if(self.child!=null){
			self.child.queryData();
		}
	}
	
//	数据网格 数据渲染
	CRUD.prototype.renderDataGridData = function(data){
		this.options.datagrid.data = data;
		$(this.DataGrid).datagrid('loadData',data);
		$(this.DataGrid).datagrid("resize",{height:400});
	}
	
//	数据表单 页面渲染
	CRUD.prototype.renderDataFormUI = function(){
		this.DataForm = $('#'+this.form_id).dataform(this.options.dataform);
		this.DataForm.crud = this;
		this.DataForm.bindSubmit({crud:this},this.submit);
		this.DataForm.bindCancel({crud:this},this.cancel);
		this.DataForm.disableAll();
	}
	
//	数据表单 数据渲染
	CRUD.prototype.renderDataFormData = function(data){
		this.options.dataform.data = data;
		this.DataForm.renderData(data);
		this.DataForm.disableAll();
	}
	
//	清空选择数据行
	CRUD.prototype.clearSelectedRow = function(){
		var self = this;
		self.rowData = null;
		self.rowIndex = null;
		self.DataForm.clearAll();
	}
	
//	点击添加数据按钮  前置函数
	CRUD.prototype.toAddData = function(){
		var dg = $(this).parents(".datagrid")[0];
		var g = $(dg).parent().find(".crud_datagrid_panel")[0];
		var opt = $(g).datagrid('options');
		self = opt.crud;
		if(self.beforeAdd()){
			self.operator = "a";
			self.clearSelectedRow();
			self.DataForm.enableAll();
		}
	}
	
//	点击 删除 按钮 前置 函数
	CRUD.prototype.toDeleteData = function(){
		var dg = $(this).parents(".datagrid")[0];
		var g = $(dg).parent().find(".crud_datagrid_panel")[0];
		var opt = $(g).datagrid('options');
		self = opt.crud;
		if(self.beforeDelete()){
			layer.confirm('您确认删除这条数据？', {
				icon: 3,
			    btn: ['确认','取消'] //按钮
			}, function(index){
				layer.close(index);
				self.DataForm.clearAll();
				self.DataForm.disableAll();
				self.deleteData();
			}, function(index){
				layer.close(index);
			});
		}
	}
	
//	点击 更新 按钮 前置 函数
	CRUD.prototype.toUpdateData = function(){
		var dg = $(this).parents(".datagrid")[0];
		var g = $(dg).parent().find(".crud_datagrid_panel")[0];
		var opt = $(g).datagrid('options');
		self = opt.crud;
		self.operator = "u";
		if(self.rowData==null){
			layer.msg("请选择一行数据",{icon:3});
		}else{
			self.DataForm.enableAll();
		}
	}
	
//	表单 提交前置 函数，包含 ，添加&更新 接口请求
	CRUD.prototype.beforeSubmit = function(){
		var result = true;
		result = this.DataForm.beforeSubmit();
		return result;
	}
	
//	调用删除 接口 前置函数
	CRUD.prototype.beforeDelete = function(){
		var self = this;
		if(self.rowData==null){
			layer.msg("请选择一行数据",{icon:3});
			return false;
		}else{
			return true;
		}
	}
	
//	调用添加 接口 前置函数
	CRUD.prototype.beforeAdd = function(){
		var self = this;
		if(self.parent!=null){
			if(self.parent.rowData==null){
				layer.msg(self.parent.options.cascade.toAddText,{icon:3});
				return false;
			}
		}
		return true;
	}
	
//	数据查询 提交前置 函数
	CRUD.prototype.beforeQuery = function(){
		return true;
	}
	
//	删除数据，接口请求 
	CRUD.prototype.deleteData = function(){
		var self = this;
		var url = self.options.deleteUrl;
		var param = {};
		var idKey = self.options.idKey;
		var dataId = self.options.dataId;
		var callback = self.afterDeleteData;
		var error = self.error;
		param[idKey] = self.rowData[dataId];
		__requestData(self, url,param,callback,error);
	}
	
	
//	数据查询
	CRUD.prototype.queryData = function(){
		var self = this;
		if(self.parent!=null){
			var cascade = self.parent.options.cascade;
			var fid = self.parent.rowData[cascade.id];
			self.queryDataByFid(fid);
		}else{
			if(self.beforeQuery()){
				var url = self.options.queryUrl;
				var param = {};
				var callback = self.afterQuery;
				var error = self.error;
				__requestData(self, url, param, callback, error);
			}
		}
		var c = self.child;
		while(c!=null){
			c.clearSelectedRow();
			c.renderDataGridData([]);
			c = c.child;
		}
	}
	
//	数据查询,级联到上级
	CRUD.prototype.queryDataByFid = function(fid){
		var self = this;
		var cascade = self.parent.options.cascade;
		var url = cascade.url;
		var fidKey = cascade.fid;
		var param = {};
		param[fidKey] = fid;
		var callback = self.afterQuery;
		var error = self.error;
		__requestData(self, url, param, callback, error);
	}
	
//	表单提交 成功后置函数
	CRUD.prototype.afterSubmit = function(self, json){
		self.DataForm.disableAll();
		if(json&&json.result&&json.result.Code==200){
			if(self.operator === "a"){
				layer.msg("添加数据成功",{icon:6});
			}
			if(self.operator === "u"){
				layer.msg("更新数据成功",{icon:6});
			}
			self.queryData();
		}else{
			if(self.operator === "a"){
				layer.msg("添加数据失败",{icon:5});
			}
			if(self.operator === "u"){
				layer.msg("更新数据失败",{icon:5});
			}
		}
	}
	
//	删除数据 接口请求 成功 后置方法
	CRUD.prototype.afterDeleteData = function(self, json){
		if(json&&json.result&&json.result.Code==200){
			layer.msg("删除数据成功",{icon:6});
			self.rowIndex = null;
			self.rowData = null;
			self.DataForm.disableAll();
			self.queryData();
		}else{
			layer.msg("删除数据失败",{icon:5});
		}
	}
	
//	查询成功，后置函数
	CRUD.prototype.afterQuery = function(self,json){
		if(json&&json.result&&json.result.Code==200){
			var data = json.result.Response;
			self.renderDataGridData(data);
		}else{
			layer.msg("数据查询失败",{shift:6,icon:5});
		}
	}
	
//	ajax 请求失败
	CRUD.prototype.error = function(self, XMLHttpRequest, textStatus, errorThrown){
		layer.msg("ajax请求失败",{icon:5});
	}
	
//	表单 确认按钮点击 执行函数
	CRUD.prototype.submit = function(e){
		var self = e.data.crud;
		var cascade = self.options.cascade;
		if(self.beforeSubmit()){
			var url = null;
			var param = self.DataForm.getData();
			if(self.parent!=null){
				var cascade = self.parent.options.cascade;
				var fid = self.parent.rowData[cascade.id];
				param[cascade.fid] = fid;
			}
			var idKey = self.options.idKey;
			var dataId = self.options.dataId;
			var callback = self.afterSubmit;
			var error = self.error;
			if(self.operator === "a"){
				url = self.options.addUrl;
			}
			if(self.operator === "u"){
				url = self.options.updateUrl;
				param[idKey] = self.rowData[dataId];
			}
			__requestData(self,url,param,callback,error);
		}
	}
	
//	表单 取消按钮点击 执行函数
	CRUD.prototype.cancel = function(e){
		var self = e.data.crud;
		self.DataForm.disableAll();
	}
	
//	框架 查询 级联
	CRUD.prototype.cascade = function(child,cascadeOpts){
		var self = this;
		self.child = child;
		child.parent = self;
		self.options.cascade = $.extend(true,{},self.options.cascade,cascadeOpts);
	}
//	废弃级联
	CRUD.prototype.ncascade = function(){
		var self = this;
		self.child = null;
		self.parent = null;
	}

//	jquery 插件，只赋予对应元素第一个
	$.fn.crud = function(options) {
		if(this&&this.length>0){
			return new CRUD(this[0],options);
		}
    };
})(jQuery,layer,window,document);