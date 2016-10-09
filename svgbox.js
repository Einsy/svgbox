/**
 * by huzc818
 */

/**
 * [getTransformToElement 相对变换矩阵]
 * @param  {[type]} toElement [description]
 * @return {[type]}           [description]
 */
if(!SVGElement.prototype.getTransformToElement){
	SVGElement.prototype.getTransformToElement = function(toElement) {  
		return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());  
	};
};

/**
 * [convertToAbsolute 将相对坐标转绝对坐标，小写转大写]
 * @return {[dom]} [本节点]
 */
SVGPathElement.prototype.convertToAbsolute=function(){
	var path=this;
	var x0,y0,x1,y1,x2,y2;
	var segs = path.pathSegList;
	for (var x=0,y=0,i=0,len=segs.numberOfItems;i<len;++i){
		var seg = segs.getItem(i);
		var c=seg.pathSegTypeAsLetter;
		if (/[MLHVCSQTA]/.test(c)){
			if ('x' in seg){ x=seg.x;}
			if ('y' in seg){ y=seg.y;}
		} else {
			if ('x1' in seg) x1=x+seg.x1;
			if ('x2' in seg) x2=x+seg.x2;
			if ('y1' in seg) y1=y+seg.y1;
			if ('y2' in seg) y2=y+seg.y2;
			if ('x'  in seg) x+=seg.x;
			if ('y'  in seg) y+=seg.y;
			switch(c){
				case 'm':{ segs.replaceItem(path.createSVGPathSegMovetoAbs(x,y),i);                    break;}
				case 'l':{ segs.replaceItem(path.createSVGPathSegLinetoAbs(x,y),i);                    break;}
				case 'h':{ segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x),i);            break;}
				case 'v':{ segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y),i);              break;}
				case 'c':{ segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x,y,x1,y1,x2,y2),i);  break;}
				case 's':{ segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x,y,x2,y2),i);  break;}
				case 'q':{ segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x,y,x1,y1),i);    break;}
				case 't':{ segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x,y),i);    break;}
				case 'a':{ 
					var r1=seg.r1;
					var r2=seg.r2;
					var angle=seg.angle;
					var lFlag=seg.largeArcFlag;
					var sFlag=seg.sweepFlag;
					var ArcAbs=path.createSVGPathSegArcAbs(x,y,r1,r2,angle,lFlag,seg.sFlag);
					segs.replaceItem(ArcAbs,i);
					break;
				}
				case 'z': case 'Z': x=x0; y=y0; break;
			}
		}
		if (c=='M' || c=='m'){ 
			x0=x;
			y0=y;
		}
	}
	return this;
}

/**
 * [PointMatrix 节点做矩阵变换]
 * @param {[type]} P [点]
 * @param {[type]} M [矩阵]
 */
SVGElement.prototype.PointMatrix=function(P,M){
	var x0=P.x;
	var y0=P.y;
	var x=M.a*x0+M.c*y0+M.e;
	var y=M.b*x0+M.d*y0+M.f;
	return {x:x,y:y};
}

/**
 * [setMatrix 未元素定义矩阵属性]
 * @param {[type]} M [description]
 */
SVGElement.prototype.setMatrix=function(M){
	var str=[M.a,M.b,M.c,M.d,M.e,M.f].join(",");
	this.setAttr("transform","matrix("+str+")");
}

/**
 * [SimpleAbsPath 消去元素的transform变换]
 */
SVGElement.prototype.SimpleAbsPath=function(){
	var node=this;
	var pnode=node.parentNode;
	var matrix=node.getTransformToElement(pnode);
	var segs = node.pathSegList;
	var L=segs.length;
	for(var i=0;i<=L-1;i++){
		var seg = segs.getItem(i);
		var Letter=seg.pathSegTypeAsLetter;
		if(Letter=="M"){
			var point=this.PointMatrix({x:seg.x,y:seg.y},matrix);
			seg.replaceItem(node.createSVGPathSegMovetoAbs(point.x,point.y),i);
			break;
		}
		else if(Letter=="C"){
			var P1=this.PointMatrix({x:seg.x1,y:seg.y1},matrix);
			var P2=this.PointMatrix({x:seg.x2,y:seg.y2},matrix);
			var P=this.PointMatrix({x:seg.x,y:seg.y},matrix);
			seg.replaceItem(node.createSVGPathSegCurvetoCubicAbs(P.x,P.y,P1.x,P1.y,P2.x,P2.y),i); 
			break;
		}
		else if(Letter=="L"){
			var P=this.PointMatrix({x:seg.x,y:seg.y},matrix);
			seg.replaceItem(node.createSVGPathSegLinetoAbs(x,y),i); 
			break;
		}
		else if(Letter=="H"){
			var P=this.PointMatrix({x:seg.x,y:0},matrix);
			seg.replaceItem(node.createSVGPathSegLinetoHorizontalAbs(P.x),i); 
			break;
		}
		else if(Letter=="V"){
			var P=this.PointMatrix({x:0,y:seg.y},matrix);
			seg.replaceItem(node.createSVGPathSegLinetoVerticalAbs(P.y),i); 
			break;
		}
		else if(Letter=="S"){
			var P=this.PointMatrix({x:seg.x,y:seg.y},matrix);
			var P2=this.PointMatrix({x:seg.x2,y:seg.y2},matrix);
			seg.replaceItem(node.createSVGPathSegCurvetoCubicSmoothAbs(P.x,P.y,P2.x,P2.y),i);
			break;
		}
		else if(Letter=="Q"){
			var P=this.PointMatrix({x:seg.x,y:seg.y},matrix);
			var P1=this.PointMatrix({x:seg.x1,y:seg.y1},matrix);
			seg.replaceItem(node.createSVGPathSegCurvetoCubicSmoothAbs(P.x,P.y,P1.x,P1.y),i);
			break;
		}
		else if(Letter=="T"){
			var P=this.PointMatrix({x:seg.x,y:seg.y},matrix);
			seg.replaceItem(node.createSVGPathSegCurvetoQuadraticSmoothAbs(P.x,P.y),i);
			break;
		}
		else if(Letter=="A"){
			var r1=seg.r1;
			var r2=seg.r2;
			var angle=seg.angle;
			var lFlag=seg.largeArcFlag;
			var sFlag=seg.sweepFlag;
			var ArcAbs=path.createSVGPathSegArcAbs(x,y,r1,r2,angle,lFlag,seg.sFlag);
			segs.replaceItem(ArcAbs,i);
			break;
		}
	}
	return this;
}

/**
 * [getOutBBox 获取元素的box外边框，改进了原生的bbox函数]
 * @return {[JSON]} [box信息]
 */
SVGElement.prototype.getOutBBox=function(flag){
	var box=this.getBBox();
	if(flag){return box}
	var svgroot=this.ownerSVGElement;
	if(this.nodeName=="svg"){
		return false;
	}
	var M=this.getScreenCTM();
	var pointA= svgroot.createPoint(box.x, box.y).MT(M);
	var pointB= svgroot.createPoint(box.x+box.width, box.y).MT(M);
	var pointC= svgroot.createPoint(box.x+box.width, box.y+box.height).MT(M);
	var pointD= svgroot.createPoint(box.x, box.y+box.height).MT(M);

	var minx=Math.min(pointA.x, pointB.x, pointC.x, pointD.x);
	var miny=Math.min(pointA.y, pointB.y, pointC.y, pointD.y);
	var maxx=Math.max(pointA.x, pointB.x, pointC.x, pointD.x);
	var maxy=Math.max(pointA.y, pointB.y, pointC.y, pointD.y);
	var midx=(minx+maxx)/2;
	var midy=(miny+maxy)/2;

	var robj={
		x:minx,
		y:miny,
		width:maxx-minx,
		height:maxy-miny,
		center:{
			x:midx,
			y:midy
		},
		point:[
			pointA,
			pointB,
			pointC,
			pointD
		],
		max:{
			x:maxx,
			y:maxy
		},
		min:{
			x:minx,
			y:miny
		}
	};
	return robj;
}

/**
 * [getParentBBox 获取元素的box外边框，相对于parent]
 * @return {[JSON]} [box信息]
 */
SVGElement.prototype.getParentBBox=function(){
	var box=this.getBBox();
	var svgroot=this.ownerSVGElement;
	if(this.nodeName=="svg"){
		return false;
	}
	var M=this.getTransformToElement(this.parentNode);
	var pointA= svgroot.createPoint(box.x, box.y).MT(M);
	var pointB= svgroot.createPoint(box.x+box.width, box.y).MT(M);
	var pointC= svgroot.createPoint(box.x+box.width, box.y+box.height).MT(M);
	var pointD= svgroot.createPoint(box.x, box.y+box.height).MT(M);

	var minx=Math.min(pointA.x, pointB.x, pointC.x, pointD.x);
	var miny=Math.min(pointA.y, pointB.y, pointC.y, pointD.y);
	var maxx=Math.max(pointA.x, pointB.x, pointC.x, pointD.x);
	var maxy=Math.max(pointA.y, pointB.y, pointC.y, pointD.y);
	var midx=(minx+maxx)/2;
	var midy=(miny+maxy)/2;

	var robj={
		x:minx,
		y:miny,
		width:maxx-minx,
		height:maxy-miny,
		center:{
			x:midx,
			y:midy
		},
		point:[
			pointA,
			pointB,
			pointC,
			pointD
		],
		max:{
			x:maxx,
			y:maxy
		},
		min:{
			x:minx,
			y:miny
		}
	};
	return robj;
}
/**
 * [setAttr 设置属性的函数，可批量设置，传入json]
 */
SVGElement.prototype.setAttr=function(){
	var A=arguments;
	var L=A.length;
	if(L==1){
		for(var x in A[0]){
			if(A[0][x]){
				this.setAttribute(x,A[0][x]);
			}
		}       
	}
	if(L==2){
		this.setAttribute(A[0],A[1]);
	}
	return this;
}

/**
 * [getAttr 获取所有属性]
 * @param  {[type]} name [属性名]
 * @return {[type]}      [所有属性值或者单个属性值]
 */
SVGElement.prototype.getAttr=function(name){
	if(name){
		return this.getAttribute(name);
	}
	var attributes=this.attributes;
	var L=attributes.length;
	var List={};
	for(var i=0;i<=L-1;i++){
		var name=attributes[i].name;
		var value=attributes[i].value;
		List[name]=value;
	}
	return List;
}

/**
 * [getRangeData 计算g元素添加8点框的数据，返回数据和svg文本]
 * @return {[type]} [description]
 */
SVGElement.prototype.getRangeData=function(){
	var svgroot=this.ownerSVGElement;
	var name=this.nodeName;
	if(name!="g"){return false}
	var box=this.getBBox();
	//var box=this.getOutBBox();
	var x=0;
	var y=0;
	var w=box.width;
	var h=box.height;
	var text=[
	"<g class='rect-range'>",
		"<rect x='0' y='0' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='"+box.width/2+"' y='0' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='"+box.width+"' y='0' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='"+box.width+"' y='"+box.height/2+"' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='"+box.width+"' y='"+box.height+"' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='"+box.width/2+"' y='"+box.height+"' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='0' y='"+box.height+"' width='4' height='4' fill='white' stroke='black'/>",
		"<rect x='0' y='"+box.height/2+"' width='4' height='4' fill='white' stroke='black'/>",
	"</g>"
	].join("");
	var ns="http://www.w3.org/2000/svg";
	var g = document.createElementNS(ns, "g");
	var rect=[];
	var X=[0,w/2,w,w,w,w/2,0,0];
	var Y=[0,0,0,h/2,h,h,h,h/2];
	var rectBorder=document.createElementNS(ns, "rect");
	var attrs={
		"x":0,
		"y":0,
		"width":w,
		"height":h,
		"fill":"none",
		"stroke":"black",
		"stroke-width":0.2,
		"stroke-dasharray":"1 1"
	};
	rectBorder.setAttr(attrs);
	g.appendChild(rectBorder);
	for(var i=0;i<=7;i++){
		rect[i]=document.createElementNS(ns, "rect");
		var obj={x:X[i]-2,y:Y[i]-2,width:4,height:4,fill:"white",stroke:"black","stroke-width":0.2};
		rect[i].setAttr(obj);
		g.appendChild(rect[i]);
	}
	g.setAttr({"class":"rect-range"});
	return {node:g,text:text};
}

/**
 * [transformCenter 对某元素做矩阵变换]
 * @param  {[object]} tm [变换矩阵]
 * @return {[dom]}    [本节点]
 */
SVGElement.prototype.transformCenter=function(tm){
	var svgroot=this.ownerSVGElement;
	var pnode=this.parentNode;
	var cm=this.getScreenCTM(); //当前矩阵变换
	var pm=pnode.getScreenCTM(); //父矩阵变换
	var rm= pm.inverse().multiply(cm); //相对父矩阵变换
	//相似矩阵
	var M=pm.inverse().multiply(tm).multiply(pm);
	M=M.multiply(rm);
	//console.log([pm.inverse(),tm,cm,pm,rm,M])
	var A=[M.a,M.b,M.c,M.d,M.e,M.f].join(",");
	var str="matrix("+A+")";
	this.setAttribute("transform",str);
	return this;
}

/**
 * [hasClass 含有某class名的判断]
 * @param  {[type]}  cname [class类]
 * @return {Boolean}       [是否]
 */
SVGElement.prototype.hasClass=function(cname){
	return this.matches(cname);
}

/**
 * [flip 翻转函数]
 * @param  {[string]} type [翻转类型x,y]
 * @return {[dom]}      [本节点]
 */

SVGElement.prototype.flip=function(type){
	var box=this.getOutBBox();
	var t=box.center[type];
	var svgroot=this.ownerSVGElement;
	var tm=svgroot.createSVGMatrix();
	if(type=="x"){
		tm.a=-1;
		tm.e=2*t;
	}
	if(type=="y"){
		tm.d=-1;
		tm.f=2*t;
	}
	this.transformCenter(tm);
	return this;
}

SVGElement.prototype.flipXY=function(type,xy){
	var box=this.getOutBBox();
	//var t=box.center[type];
	//var t=box.center[type]
	var svgroot=this.ownerSVGElement;
	var tm=svgroot.createSVGMatrix();
	if(type=="x"){
		var t=box.x;
		tm.a=-1;
		tm.e=2*t;
	}
	if(type=="y"){
		var t=box.y;
		tm.d=-1;
		tm.f=2*t;
	}
	this.transformCenter(tm);
	return this;
}

/**
 * [flipx 水平翻转]
 * @return {[dom]} [本节点]
 */
SVGElement.prototype.flipx=function(){
	return this.flip("x");
}

/**
 * [flipy 上下翻转]
 * @return {[dom]} [本节点]
 */
SVGElement.prototype.flipy=function(){
	return this.flip("y");
}

/**
 * [rotmatrix dom执行旋转矩阵]
 * @param  {[Number]} theta [角度]
 * @param  {[Number]} a     [x]
 * @param  {[Number]} b     [y]
 * @return {[matrix]}       [矩阵]
 * var tm=tm0.translate(a,b).rotate(theta).translate(-a,-b);
 */
SVGElement.prototype.rotmatrix=function(theta,a,b){
	var alpha=theta*Math.PI/180;  
	var cos_t=Math.cos(alpha);
	var sin_t=Math.sin(alpha);
	var svgroot=this.ownerSVGElement;
	var tm1=svgroot.createMatrix(cos_t,sin_t,-sin_t,cos_t,0,0);
	var tm2=svgroot.createMatrix(1,0,0,1,a,b);
	var tm3=svgroot.createMatrix(1,0,0,1,-a,-b);
	var tm=tm2.multiply(tm1).multiply(tm3);
	return tm;
}

/**
 * [rotate 旋转变换]
 * @param  {[Number]} theta [角度]
 * @param  {[Number]} a     [x]
 * @param  {[Number]} b     [y]
 * @return {[matrix]}       [矩阵]
 */
SVGElement.prototype.rotate=function(theta,a,b){
	var L=arguments.length;
	if(L==1){
		var a=0;
		var b=0;
		var box=this.getOutBBox();
		a=box.x+box.width/2;
		b=box.y+box.height/2;
	}
	var svgroot=this.ownerSVGElement;
	var tm0=svgroot.createSVGMatrix();
	var tm=tm0.translate(a,b).rotate(theta).translate(-a,-b);
	//console.log(tm);
	this.transformCenter(tm);
}

/**
 * [translate 水平变换]
 * @param  {[Number]} x [x]
 * @param  {[Number]} y [y]
 * @return {[dom]}   [本节点]
 */
SVGElement.prototype.translate=function(dx,dy){
	var svgroot=this.ownerSVGElement;
	var tm=svgroot.createMatrix(1,0,0,1,dx,dy);
	//console.log([dx,dy,tm]);
	this.transformCenter(tm);
	return this;
}

/**
 * [toPoint 将左上角移动到视图点x0,y0处]
 * @param  {[type]} x0 [description]
 * @param  {[type]} y0 [description]
 * @return {[type]}    [description]
 */
SVGElement.prototype.toPoint=function(x0,y0,flag){
	var svgroot=this.ownerSVGElement;
	var pm=this.getTransformToElement(this.parentNode);
	if(flag){
		var M=this.getOutBBox();
		var dx=x0-M.x;
		var dy=y0-M.y;		
	} else{
		var M=this.getBBox();
		var dx=x0-M.x;
		var dy=y0-M.y;	
	}
	return  this.translate(dx,dy);
}

/**本元素向其他元素的变换
 * @param  {[其他元素]}
 * @return {[矩阵变换]}
 */
SVGElement.prototype.transformToElement=function(rect,flag){
	if(flag){
		var rect1=this.getBBox();
		var rect2=rect.getBBox();
	} else{
		var rect1=this.getOutBBox();
		var rect2=rect.getOutBBox();        
	}
	var svgroot=this.ownerSVGElement;
	var tm=svgroot.createSVGMatrix();
	var x1=rect1.x;
	var y1=rect1.y;
	var w1=rect1.width;
	var h1=rect1.height;
	
	var x2=rect2.x;
	var y2=rect2.y;
	var w2=rect2.width;
	var h2=rect2.height;

	tm.a=w2/w1;
	tm.b=0;
	tm.c=0;
	tm.d=h2/h1;
	tm.e=x2-w2*x1/w1;
	tm.f=y2-h2*y1/h1;
	return tm;
}

/**
 * [createMatrix 创建矩阵]
 * @return {[matrix]} [矩阵]
 */
SVGSVGElement.prototype.createMatrix=function(){
	var A=arguments;
	var isArray=Object.prototype.toString.call(A[0]);
	var M=this.createSVGMatrix();
	if(A.length==1){
		if(isArray=="[object Array]"){
			M.a=A[0][0];
			M.b=A[0][1];
			M.c=A[0][2];
			M.d=A[0][3];
			M.e=A[0][4];
			M.f=A[0][5];
			return M;           
		}
		if(isArray=="[object object]"){
			M.a=A[0].a;
			M.b=A[0].b;
			M.c=A[0].c;
			M.d=A[0].d;
			M.e=A[0].e;
			M.f=A[0].f;
			return M;           
		}
	}
	if(A.length==6){
		M.a=A[0];
		M.b=A[1];
		M.c=A[2];
		M.d=A[3];
		M.e=A[4];
		M.f=A[5];
		return M;
	}
}

/**
 * [createPoint 创建SVGPoint]
 * @return {[type]} [SVGPoint]
 */
SVGSVGElement.prototype.createPoint=function(){
	var A=arguments;
	var isArray=Object.prototype.toString.call(A[0]);
	var point=this.createSVGPoint();
	if(A.length==1){
		if(isArray=="[object Array]"){
			point.x=A[0][0];
			point.y=A[0][1];
			return point;           
		}
		if(isArray=="[object object]"){
			point.x=A[0].x;
			point.y=A[0].y;
			return point;           
		}
	}
	if(A.length==2){
		point.x=A[0];
		point.y=A[1];
		return point;
	}
}

/**
 * [MT 简写matrixTransform]
 * @param {[type]} mt [SVGPoint]
 */
SVGPoint.prototype.MT=function(mt){
	return this.matrixTransform(mt);
}

/**
 * [simpleTransform 简化transform]
 * @return {[dom]} [本节点]
 */
SVGElement.prototype.simpleTransform=function(){
	var svgroot=this.ownerSVGElement;
	var node=this;
	var name=node.nodeName;
	var pnode=node.parentNode;
	var matrix=node.getTransformToElement(pnode);
	switch(name){
		case "line":{
			var attrs=node.getAttr();
			var x1=attrs.x1;
			var y1=attrs.y1;
			var x2=attrs.x2;
			var y2=attrs.y2;
			var pointA=svgroot.createPoint(x1,y1).MT(matrix);
			var pointB=svgroot.createPoint(x2,y2).MT(matrix);
			node.setAttribute("transform","matrix(1,0,0,1,0,0)");
			node.setAttr({
				x1:pointA.x,
				y1:pointA.y,
				x2:pointB.x,
				y2:pointB.y
			});
			break;
		}
		case "rect":{ //有问题，rect最后应该变成path才对
			var attrs=node.getAttr();
			var x=attrs.x;
			var y=attrs.y;
			var w=attrs.width;
			var h=attrs.height;
			var pointA=svgroot.createPoint(x,y).MT(matrix);
			node.setAttribute("transform","matrix(1,0,0,1,0,0)");
			node.setAttr(pointA);
			break;
		}
		case "circle":{ //有问题，circle应该变成椭圆才对
			var cx=node.getAttribute("cx");
			var cy=node.getAttribute("cy");
			var r=node.getAttribute("r");
			var pointA=svgroot.createPoint(cx,cy).MT(matrix);
			node.setAttribute("transform","matrix(1,0,0,1,0,0)");
			node.setAttr({"cx":pointA.x,"cy":pointA.y});
			break;
		}
		case "ellipse":{

			break;
		}
		case "path":{
			this.convertToAbsolute(node);
			var segs = path.pathSegList;
			break;
		}
		case "polyline":{

			break;  
		}
		case "polygon":{

			break;  
		}
	}
	return node;
}

/**
 * [simpleGroup 化简群组的transorm]
 * @return {[dom]} [本群组]
 */
SVGGElement.prototype.simpleGroup=function(){
	var gnode=this;
	if(gnode.nodeName!=="g"){return}
	var pnode=gnode.parentNode;
	var M=gnode.getTransformToElement(pnode);
	var transform=gnode.getAttribute("transform");
	//var pm=gnode.getTransformToElement(gnode.parentNode);
	var A=gnode.children;
	var L=A.length;
	for(var i=0;i<=L-1;i++){
		var Atrans=A[i].getAttribute("transform");
		if(!Atrans){
			console.log(i,"子元素不存在tansform,直接作用到每个子元素");
			A[i].setAttribute("transform",transform);
		}
		else{
			console.log(i,"子元素存在transform");
			var M=A[i].getTransformToElement(pnode);		
			var str=[M.a,M.b,M.c,M.d,M.e,M.f].join(",");
			A[i].setAttribute("transform","matrix("+str+")");
		}
	}
	var E="matrix(1,0,0,1,0,0)";
	gnode.setAttribute("transform",E);
	return gnode;
}

/**
 * [unGroup 解散群组]
 */
SVGGElement.prototype.unGroup=function(){
	var gnode=this;
	if(gnode.nodeName!=="g"){return}
	var bgrect=gnode.querySelector(".circuit-bgrect");
	if(bgrect){
		bgrect.remove();
	}
	this.simpleGroup();
	var pnode=gnode.parentNode;
	var A=gnode.children;
	var L=A.length;
	for(var i=0;i<=L-1;i++){
		pnode.appendChild(A[i].cloneNode(true));
	}
	gnode.remove();
}

SVGSVGElement.prototype.getMaxBox=function(A){
	//console.log("getMaxBox",A);
	var L=A.length;
	var box0=A[0].getOutBBox();
	var minx=box0.x;
	var miny=box0.y;
	var maxx=box0.x+box0.width;
	var maxy=box0.y+box0.height;
	for(var i=0;i<=L-1;i++){
		var box=A[i].getOutBBox();
		minx=Math.min(minx,box.x);
		miny=Math.min(miny,box.y);
		maxx=Math.max(maxx,box.x+box.width);
		maxy=Math.max(maxy,box.y+box.height);
	}
	return {
		x:minx,
		y:miny,
		width:maxx-minx,
		height:maxy-miny
	};
}

/**
 * [getBorder 获取边框rrect]
 * @param  {[布尔]} flag [true使用新的，false使用原生的bbox]
 * @return {[json]}      [rect]
 */
SVGGElement.prototype.getBorder=function(flag){
	if(!flag){return this.getBBox();}
	var A=this.childNodes;
	var svgroot=this.ownerSVGElement;
	return svgroot.getMaxBox(A);
}

/**
 * [addBG group元素添加透明背景]
 * @param {[布尔]} flag [是否使用原生bbox来判断]
 * @param {[dom]} pobj [本节点]
 */
SVGGElement.prototype.addTransparentMask=function(flag){
	var mask=this.querySelector("rect.transparent-mask");
	if(mask){
		return;
	}
	var box=this.getBorder(flag);
	var NS="http://www.w3.org/2000/svg";
	var rect=document.createElementNS(NS, "rect");
	var obj={
		"class":"transparent-mask",
		"x":box.x,
		"y":box.y,
		"width":box.width,
		"height":box.height,
		"stroke":"none",
		"fill":"green",
		"fill-opacity":"0"
	}
	rect.setAttr(obj);
	var first=this.firstChild;
	if(first){
		this.insertBefore(rect,first);
	}
	else{
		this.appendChild(rect);	
	}
	return rect;
}

/**
 * [forEach 遍历g元素下所有的节点]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
SVGElement.prototype.forEach=function(fn){
	var self=this;
	var name=self.nodeName;
	if(name!=="g"&&name!=="svg"){
		fn.call(this,self);
		return self;
	}
	var A=self.children;
	var L=A.length;
	for(var i=0;i<=L-1;i++){
		var namei=A[i].nodeName;
		if(namei=="g"||namei=="svg"){
			A[i].forEach(fn);
		}
		else{
			fn.call(this,A[i]);
		}
	}
	return self;
}

/**
 * [dashArray 给元素设置虚线样式，包括给群组设置虚线样式]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
SVGElement.prototype.dashArray=function(value){
	this.setAttrMap("stroke-dasharray",value||"5 5");
}

/**
 * [setAttrMap 遍历所有元素设置样式]
 * @param {[type]} prop  [description]
 * @param {[type]} value [description]
 */
SVGElement.prototype.setAttrMap=function(prop,value){
	this.forEach(function(el){
		el.setAttr(prop,value);
	});
}

/**
 * [$ 通过id获取节点]
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
SVGSVGElement.prototype.$=function(id){
	var node=this.querySelector("#"+id);
	return node;
}

/**
 * [inRule 节点是否属于某规则]
 * @param  {[type]} rule [规则]
 * @return {[type]}      [是否]
 */
SVGElement.prototype.inRule=function(rule){
	if(typeof(rule)=="string"){
		return this.matches(rule);
	}
	if(typeof(rule)=="object"){
		for(var prop in rule){
			if(this.getAttribute(prop)!==rule[prop]){
				return false;
			}
		}
		return true;
	}
}

/**
 * [addEvent 绑定事件，可以委托选择，使用css选择器，绑定特定元素的事件]
 */
SVGSVGElement.prototype.addEvent=function(){
	var self=this;
	var A=arguments;
	var L=A.length;
	var name=A[0];
	var fn=A[L-1];
	var isfn=Object.prototype.toString.call(fn);
	if(isfn!=="[object Function]"){return this;}
	self.addEventListener(name,function(evt){
		var enode=evt.target;
		if(L==2){
			fn&&fn.call(self,evt); 
			return;
		}
		if(L==3){
			if(enode.matches(A[1])){
				fn&&fn.call(self,evt);
			}
		}
	});
	return this;
}

/**
 * [addSvgData 加入svg文本数据]
 * @param {[type]} type   [description]
 * @param {[type]} svgstr [description]
 */
SVGElement.prototype.addStringSvgData=function(type,svgstr){
	var strClear=function(str){
		str=str.replace(/\s+</gi,"<");
		str=str.replace(/>\s+/gi,">");
		str=str.replace(/\n/gi,"");
		str=str.replace(/<title\/>/gi,"");
		str=str.replace(/<desc\/>/gi,"");
		str=str.replace(/<title>(.*?)?<\/title>/gi,"");
		str=str.replace(/<desc>(.*?)?<\/desc>/gi,"");
		str=str.replace(/<defs>(.*?)?<\/defs>/gi,"");
		str=str.replace(/<svg(.*?)>/gi,"");
		str=str.replace(/<\/svg>/gi,"");
		return str;
	}

	svgstr=strClear(svgstr);
	var str = "<svg id='wrapper' xmlns='http://www.w3.org/2000/svg'>" + svgstr + "</svg>";
	var div = document.createElement('div');
	div.innerHTML = str;
	var svg = div.querySelector('svg');
	this.addNodes(type,svg.childNodes);
	return this;
}

/**
 * [replaceNode 替换方法]
 * @param  {[type]} target [description]
 * @return {[type]}        [description]
 */
SVGElement.prototype.replaceNode=function(target){
	return this.parentNode.replaceChild(target,this);
}

/**
 * [swapNode 交换方法]
 * @param  {[type]} target [description]
 * @return {[type]}        [description]
 */
SVGElement.prototype.swapNode2=function(target){
	var targetParent=target.parentNode;
	var targetNextSibling=target.nextSibling;
	var MthisNode=this.parentNode.replaceChild(target,this);
	thisNode=MthisNode.cloneNode(true);
	MthisNode.remove();
	if(targetNextSibling){
		targetParent.insertBefore(thisNode,targetNextSibling);
	} else{
		targetParent.appendChild(thisNode);
	}
	return this;
}

SVGElement.prototype.swapNode=function(target){
	//var html_self=this.outerHTML;
	//var html_target=target.outerHTML;
	//target.outerHTML=html_self;
	//this.outerHTML=html_target;
	var thisClone=this.cloneNode(true);
	var targetClonet=target.cloneNode(true);

	target.parentNode.insertBefore(thisClone,target);
	target.remove();

	this.parentNode.insertBefore(targetClonet,this);
	this.remove();
	return this;
}

/**
 * [moveOrder 移动节点顺序]
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
SVGElement.prototype.moveOrder=function(type){
	var preNode=this.previousElementSibling;
	var nextNode=this.nextElementSibling;
	switch(type){
		case "up": {
			if(!nextNode){return this}
			nextNode.addNode("after",this.cloneNode(true));
			this.remove();
			break;
		}
		case "down": {
			if(!preNode){return this}
			preNode.addNode("before",this.cloneNode(true));
			this.remove();
			break;
		}
		case "top": {
			if(!nextNode){return this}
			this.parentNode.appendChild(this.cloneNode(true));
			this.remove();
			break;
		}
		case "bottom": {
			if(!preNode){return this}
			var pnode=this.parentNode;
			pnode.insertBefore(this.cloneNode(true),pnode.firstChild);
			this.remove();
			break;
		}
	}
	return this;
}

/**
 * [addNodes 加入一系列节点]
 * @param {[type]} type  [description]
 * @param {[type]} nodes [description]
 */
SVGElement.prototype.addNodes=function(type,nodes){
	type=type.toLowerCase();
	var L=nodes.length;
	//console.log("L="+L);
	for(var i=0;i<=L-1;i++){
		var index=i;
		if(type=="before"||type=="last"){
			index=i;
		}
		else if(type=="first"||type=="after"){
			index=L-1-i;
		}
		//console.log(i,nodes[index],index);
		this.addNode(type,nodes[index]);
	}
	return this;
}

/**
 * [addNode 当前元素附近插入其他节点；]
 * @param {[type]} type [description]
 * @param {[type]} node [description]
 */
SVGElement.prototype.addNode=function(type,node){
	type=type.toLowerCase();
	if(node&&node.nodeType!==1){
		return this;
	}
	var name=this.nodeName;
	//console.log("name="+name,type);
	switch(type){
		case "before":{
			this.parentNode.insertBefore(node,this);
			break;
		}
		case "first":{
			if(name!=="g"){return this}
			this.insertBefore(node,this.firstChild);
			break;
		}
		case "last":{
			if(name!=="g"){return this}
			this.appendChild(node);
			break;
		}
		case "after":{
			var next=this.nextSibling;
			if(next){
				this.parentNode.insertBefore(node,next);
			} else{
				this.parentNode.appendChild(node);
			}
			break;
		}
	}
	return  this;
}

/**
 * [zoomTo 缩放，四个角落或者针对指定坐标位置的缩放]
 * @param  {[type]} ratio    [description]
 * @param  {[type]} position [description]
 * @return {[type]}          [description]
 */
SVGSVGElement.prototype.zoomToRatio=function(ratio,position){
	if(!position){
		var viewBox=this.viewBox.baseVal;
		return this;
	}

	switch(position){
		case "leftTop":{
			break;
		}
		case "rightTop":{
			break;
		}
		case "leftBottom":{
			break;
		}
		case "leftBottom":{
			break;
		}
		default:{
			var cx=position.x;
			var cy=position.y;
		}
	}
	return this;
}

SVGElement.prototype.hide=function(){
	this.style.display="none";
}

SVGElement.prototype.show=function(){
	this.style.display="block";
}
/*
SVGSVGElement.prototype.addElement=function(nodeName,obj){
	var NS = "http://www.w3.org/2000/svg";
	var dom = document.createElementNS(NS, nodeName);
	dom.setAttr(obj);
	this.appendChild(dom);
	return this.lastChild;
}

SVGGElement.prototype.addElement=function(nodeName,obj){
	var NS = "http://www.w3.org/2000/svg";
	var dom = document.createElementNS(NS, nodeName);
	dom.setAttr(obj);
	this.appendChild(dom);
	return this;
}
*/

SVGElement.prototype.addElement=function(nodeName,obj){
	var name=this.nodeName;
	if(name!=="g"&&name!=="svg"){return this;}
	var NS = "http://www.w3.org/2000/svg";
	var dom = document.createElementNS(NS, nodeName);
	dom.setAttr(obj);
	this.appendChild(dom);
	return this.lastChild;	
}


//#######SVGGElement##########
SVGGElement.prototype.line=function(obj){
	return this.addElement("line",obj);
}

SVGGElement.prototype.rect=function(obj){
	return this.addElement("rect",obj);
}

SVGGElement.prototype.ellipse=function(obj){
	return this.addElement("ellipse",obj);
}

SVGGElement.prototype.circle=function(obj){
	return this.addElement("circle",obj);
}

SVGGElement.prototype.use=function(obj){
	return this.addElement("circle",obj);
}

SVGGElement.prototype.g=function(obj){
	return this.addElement("g",obj);
}

SVGGElement.prototype.path=function(obj){
	return this.addElement("path",obj);
}

SVGGElement.prototype.polyline=function(obj){
	return this.addElement("polyline",obj);
}

SVGGElement.prototype.text=function(obj){
	return this.addElement("text",obj);
}

//#######SVGSVGElement##########

SVGSVGElement.prototype.line=function(obj){
	return this.addElement("line",obj);
}

SVGSVGElement.prototype.rect=function(obj){
	return this.addElement("rect",obj);
}

SVGSVGElement.prototype.ellipse=function(obj){
	return this.addElement("ellipse",obj);
}

SVGSVGElement.prototype.circle=function(obj){
	return this.addElement("circle",obj);
}

SVGSVGElement.prototype.use=function(obj){
	return this.addElement("circle",obj);
}

SVGSVGElement.prototype.g=function(obj){
	return this.addElement("g",obj);
}

SVGSVGElement.prototype.path=function(obj){
	return this.addElement("path",obj);
}

SVGSVGElement.prototype.polyline=function(obj){
	return this.addElement("polyline",obj);
}

SVGSVGElement.prototype.text=function(obj){
	return this.addElement("text",obj);
}

//#############################################################################################
//#######################################属性的扩展############################################
////###########################################################################################
/**
 * [SVGElement扩展innerHTML属性]
 */
Object.defineProperty(SVGGElement.prototype, 'innerHTML', {
	get: function(){
		var temp = document.createElement('div');
		var node = this.cloneNode(true);
		var ref = node.childNodes;
		var len = ref.length;
		for (var i = 0; i <= len-1; i++) {
			if(!ref[i]){continue;}
			if(ref[i].nodeType!==1){continue;}
			temp.appendChild(ref[i]);
		}
		return temp.innerHTML;
	},
	set: function(markup) {
		while(this.firstChild){
			this.firstChild.parentNode.removeChild(this.firstChild);
		}
		if(markup==""){return}
		markup=markup.replace(/\s+</gi,"<").replace(/>\s+/gi,">").replace(/\n/gi,"");
		markup = "<svg id='wrapper' xmlns='http://www.w3.org/2000/svg'>" + markup + "</svg>";
		var div = document.createElement('div');
		div.innerHTML = markup;
		var svg = div.querySelector('svg#wrapper');
		var ref = svg.childNodes;
		var len = ref.length;
		for (var i = 0; i <= len-1; i++) {
			if(!ref[i]){continue;}
			if(ref[i].nodeType!==1){continue;}
			this.appendChild(ref[i]);
		}
	},
	enumerable: false,
	configurable: true,
	//writable:true
});

/**
 * [SVGElement扩展outerHTML属性]
 */
Object.defineProperty(SVGElement.prototype, 'outerHTML', {
	get: function () {
		var temp = document.createElement('div');
		var node = this.cloneNode(true);
		temp.appendChild(node);
		return temp.innerHTML;
	},
	set:function(html){
		if(html==""){return}
		html=html.replace(/\s+</gi,"<").replace(/>\s+/gi,">").replace(/\n/gi,"");
		html = "<svg id='wrapper' xmlns='http://www.w3.org/2000/svg'>" + html + "</svg>";
		var div = document.createElement('div');
		div.innerHTML = html;
		var svg = div.querySelector('svg#wrapper');
		var ref = svg.childNodes;
		var len = ref.length;
		for (var i = 0; i <= len-1; i++) {
			if(!ref[i]){continue;}
			if(ref[i].nodeType!==1){continue;}
			this.parentNode.insertBefore(ref[i],this);
		};
		this.remove();
	},
	enumerable: false,
	configurable: true,
	//writable:false
});

/**
 * [SVGElement扩展svgpan属性]
 */
Object.defineProperty(SVGSVGElement.prototype, 'svgpan', {
	get: function(){
		return value;
	},
	set: function(value){
		var self=this;
		this.value=value;
		var x0=0;
		var y0=0;
		var viewBox=this.viewBox.baseVal;
		var MouseDown=false;
		var vbx=viewBox.x;
		var vby=viewBox.y;
		var point;

		this.addEvent("mousedown",function(evt){
			if(!self.value){return}
			evt = window.event||evt;
			x0=evt.clientX;
			y0=evt.clientY;
			MouseDown=true;
			vbx=viewBox.x;
			vby=viewBox.y;
		});

		this.addEvent("mousemove",function(evt){
			if(!self.value){return}
			evt = window.event||evt;
			var x=evt.clientX;
			var y=evt.clientY;
			if(MouseDown){
				var k=viewBox.width/800;
				viewBox.x=vbx-(x-x0)*k;
				viewBox.y=vby-(y-y0)*k;
			}
		});

		this.addEvent("mouseup",function(evt){
			if(!self.value){return}
			evt = window.event||evt;
			x0=evt.clientX;
			y0=evt.clientY;
			MouseDown=false;
		});
	},
	enumerable: false,
	configurable: true,
	//writable:true
});

/**
 * [SVGElement扩展zoom属性 滚轮中心放大]
 */
Object.defineProperty(SVGSVGElement.prototype, 'svgzoom', {
	get: function(){
		return value;
	},
	set: function(value) {
		var self=this;
		return
		//this.value=value;
		var point;
		var viewBox = this.viewBox.baseVal;
		this.addEvent("mousewheel",function(evt){
			if(value==0){return}
			//console.log(222,value)
			var ratio=this.svgzoom_ratio||1.15;
			evt.preventDefault();
			evt.stopPropagation();
			var delta = 0;
			if(!evt){evt = window.event;}
			if(evt.wheelDelta){
				delta = evt.wheelDelta/120; 
			} else if (evt.detail) {
				delta = -evt.detail/3;
			}
			var move = (delta<0) ? - delta * ratio : 1/(delta*ratio);
			viewBox.x=(point.x-(point.x-viewBox.x)*move);
			viewBox.y=(point.y-(point.y-viewBox.y)*move); 
			viewBox.height = viewBox.height * move;
			viewBox.width = viewBox.width * move;
		}); 

		this.addEvent("mousemove",function(evt){
			if(value==0){return}
			var epoint = this.createPoint(evt.clientX,evt.clientY);
			point = epoint.MT(this.getScreenCTM().inverse());
		});
		return value;
	},
	enumerable: false,
	configurable: true,
	//writable:true
});

/**
 * [get SVGSVGElement扩展svgUndoRedo属性]
 */
Object.defineProperty(SVGSVGElement.prototype, 'svgUndoRedo', {
	get: function(){
		return this.value||10;
	},
	set: function(value) {
		var self=this;
		self.value=value;
		/**
		 * [saveGlance 保存当前状态数据]
		 * @return {[type]} [description]
		 */
		this.undoStack=[]; //撤销栈
		this.redoStack=[]; //重做栈

		var strClear=function(str){
			str=str.replace(/\s+</gi,"<");
			str=str.replace(/>\s+/gi,">");
			str=str.replace(/\n/gi,"");
			return str;
		}

		this.saveGlance=function(){
			if(value==0){return}
			var str=this.innerHTML;
			str=strClear(str);
			this.undoStack.push(str);
			return this.undoStack;
		}

		this.saveGlance(); //画布初始化

		/**
		 * [undo 撤销]
		 * @return {[type]} [description]
		 */
		this.undo=function(){
			if(value==0){return}
			var stack=this.undoStack;
			if(stack.length==0){return}
			var str=strClear(stack.pop());
			var html=strClear(this.innerHTML);
			if(html==str){
				console.log("相同");
				this.undo();
				return;
			}
			self.stopObserve();
			this.redoStack.push(html);
			this.innerHTML=str;
			self.startObserve();
			return str;
		}

		/**
		 * [redo 重做]
		 * @return {[type]} [description]
		 */
		this.redo = function(){
			if(value==0){return}
			var stack=this.redoStack;
			if(stack.length==0){return}
			var str=stack.pop();
			this.undoStack.push(str);
			self.stopObserve();
			this.innerHTML=str;
			self.startObserve();
			return str;
		}

		this.parentNode.addEventListener("keydown",function(evt){
			if(value==0){return}
			if(evt.ctrlKey&&evt.keyCode==90){ //ctrl+z
				console.log("undo");
				self.undo();
			}
			if(evt.ctrlKey&&evt.keyCode==89){ //ctrl+y
				console.log("redo");
				self.redo();
			}
		});

		var MutationObserver = window.MutationObserver;
		MutationObserver=MutationObserver||window.WebKitMutationObserver;
		MutationObserver=MutationObserver||window.MozMutationObserver;
		var options = {
			childList: true,
			arrtibutes: true,
			attributeOldValue: true,
			attributesFilter:[],
			subtree:true,
			characterData:false,
			characterDataOldValue:false
		}

		self.startObserve=function(){
			self.MO.observe(self,options);
		}

		self.stopObserve=function(){
			self.MO.disconnect();
		}

		self.MO = new MutationObserver(function(data){
			if(value==0){
				this.disconnect(); //this.takeRecords();
			}
			self.saveGlance();
			//console.log(data);
		});
		self.MO.observe(self,options);
	},
	enumerable: false,

	configurable: true,
	//writable:true
});

/**
 * [SVGElement扩展svgselectbox属性,有此属性则可出现虚线选择框，并带回调数据]
 */
Object.defineProperty(SVGSVGElement.prototype, 'svgSelectBox', {
	get: function(){
		return this.value;
	},
	set: function(config) {
		return;
		var self=this;
		this.value=config;
		var point;
		var mousedown=false;
		var x0=0;
		var y0=0;
		var rect;
		var NS="http://www.w3.org/2000/svg";
		var root;

		var MousePoint=function(x,y){
			var point = self.createPoint(x,y);
			var mt=self.getScreenCTM().inverse();
			point = point.MT(mt);
			return point;
		}

		this.addEvent("mousedown",function(evt){
			if(config.enable==false){return}
			if(self.penType!=="select"){return}
			mousedown=true;
			x0=evt.clientX;
			y0=evt.clientY;
			rect=document.createElementNS(NS,"rect");
			var point=MousePoint(x0,y0);
			rect.setAttr({
				"x":point.x,
				"y":point.y,
				"width":0,
				"height":0,
				"stroke":"black",
				"stroke-width":"0.5",
				"fill":"none",
				"stroke-dasharray":"3,3"
			});
			//root=self.createShadowRoot();
			root=self;
			self.stopObserve();
			root.appendChild(rect);
			config.mousedown&&config.mousedown(evt,rect);
		}); 

		this.addEvent("mousemove",function(evt){
			if(config.enable==false){return}
			if(self.penType!=="select"){return}
			var x=evt.clientX;
			var y=evt.clientY;
			var minx=Math.min(x0,x);
			var miny=Math.min(y0,y);
			var w=Math.abs(x-x0);
			var h=Math.abs(y-y0);
			var point=MousePoint(minx,miny);
			if(mousedown){
				rect.setAttr({x:point.x,y:point.y,width:w,height:h});
				config.mousemove&&config.mousemove(evt,rect);
			}
		});

		this.addEvent("mouseup",function(evt){
			if(config.enable==false){return}
			if(self.penType!=="select"){return}
			var x=evt.clientX;
			var y=evt.clientY;
			config.mouseup&&config.mouseup(evt,rect);
			rect.remove();
			//root.remove();
			mousedown=false;
			self.startObserve();
		});	
	},
	enumerable: false,
	configurable: true,
	//writable:true
});

/**
 * [movePointParent 直线简化路径后相对父元素平移]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
SVGLineElement.prototype.movePointParent=function(obj){
	this.simpleTransform();
	var svgroot=this.ownerSVGElement;
	var prop=this.getAttr();
	if(!obj.dx1){obj.dx1=0;}
	if(!obj.dy1){obj.dy1=0;}
	if(!obj.dx2){obj.dx2=0;}
	if(!obj.dy2){obj.dy2=0;}
	this.setAttr({
		x1:prop.x1-0+obj.dx1,
		y1:prop.y1-0+obj.dy1,
		x2:prop.x2-0+obj.dx2,
		y2:prop.y2-0+obj.dy2
	});
	return this;
}


SVGSVGElement.prototype.dis2view=function(dx,dy,g){
	var svgroot=this.ownerSVGElement;
	var M=g.getScreenCTM();

	var point0=this.createPoint(0,0).MT(M);
	var point1=this.createPoint(dx,0).MT(M);

	var point2=this.createPoint(0,0).MT(M);
	var point3=this.createPoint(0,dy).MT(M);

	var dx=point1.x-point0.x;
	var dy=point3.y-point2.y;
	return {dx:dx,dy:dy};
}

SVGSVGElement.prototype.view2dis=function(dx,dy,g){
	var svgroot=this.ownerSVGElement;
	var point0=this.createPoint(0,0);
	var point1=this.createPoint(dx,0);

	var point2=this.createPoint(0,0);
	var point3=this.createPoint(0,dy);

	point0=svgroot.pointNode(point0.x,point0.y,g,false);
	point1=svgroot.pointNode(point1.x,point1.y,g,false);

	point2=svgroot.pointNode(point2.x,point2.y,g,false);
	point3=svgroot.pointNode(point3.x,point3.y,g,false);

	var dx=point1.x-point0.x;
	var dy=point3.y-point2.y;
	return {dx:dx,dy:dy};
}

/**
 * [movePoint 直线通过修改x1,y1,x2,y2移动某个属性的值，这个值是从视图上移动的]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
SVGLineElement.prototype.movePoint=function(obj,g){
	var svgroot=this.ownerSVGElement;
	var prop=this.getAttr();
	var x1=prop.x1-0;
	var y1=prop.y1-0;
	var x2=prop.x2-0;
	var y2=prop.y2-0;
	//尚未考虑到line还有矩阵的情况
	var point1=svgroot.pointNode(x1,y1,g,false);
	var point2=svgroot.pointNode(x2,y2,g,false);
	if(!obj.dx1){obj.dx1=0;}
	if(!obj.dy1){obj.dy1=0;}
	if(!obj.dx2){obj.dx2=0;}
	if(!obj.dy2){obj.dy2=0;}
	point1.x=point1.x+obj.dx1;
	point1.y=point1.y+obj.dy1;
	point2.x=point2.x+obj.dx2;
	point2.y=point2.y+obj.dy2;
	var point1=svgroot.pointNode(point1.x,point1.y,g,true);
	var point2=svgroot.pointNode(point2.x,point2.y,g,true);
	this.setAttr({x1:point1.x,y1:point1.y});
	this.setAttr({x2:point2.x,y2:point2.y});
}

/**
 * [pointNode 用户坐标x,y与svg/g元素内部的圆心cx,cy坐标之间的转化]
 * @param  {[Number]}   x     [x坐标]
 * @param  {[Number]}   y     [y坐标]
 * @param  {[Node]}     g     [svg或g元素]
 * @param  {[Boolean]} flag   [转化方向]
 * @return {[Point]}      	  [返回目标点对象]
 */
SVGSVGElement.prototype.pointNode=function(x,y,g,flag){
	var point=this.createPoint(x,y);
	var M=g.getScreenCTM();
	if(flag){
		M=M.inverse();
	}
	return point.MT(M);
}

/**
 * [envelope 求一系列点的包络矩形]
 * @return {[type]} [description]
 */
SVGSVGElement.prototype.envelope=function(){
	var A=arguments;
	var L=A.length;
	var B=A;
	if(L==0){
		var type=Object.prototype.toString.call(A[0]);
		if(type=="[object Array]"){
			B=A[0];
		}
	}
	var minx=B[0].x;
	var miny=B[0].y;
	var maxx=B[0].x;
	var maxy=B[0].y;
	for(var i=0;i<=L-1;i++){
		minx=Math.min(minx,B[i].x);
		miny=Math.min(miny,B[i].y);
		maxx=Math.max(maxx,B[i].x);
		maxy=Math.max(maxy,B[i].y);
	}
	var box={
		x:minx,
		y:miny,
		width:maxx-minx,
		height:maxy-miny
	};
	return box;
}

/**
 * [translateNodes 平移一批元素]
 * @param  {[type]} nodes [description]
 * @param  {[type]} dx    [description]
 * @param  {[type]} dy    [description]
 * @return {[type]}       [description]
 */
SVGSVGElement.prototype.translateNodes=function(nodes,dx,dy){
	var L=nodes.length;
	if(L==0){return this;}
	for(var i=0;i<=L-1;i++){
		nodes[i].translate(dx,dy);
	}
	return this;
}

/**
 * [setAlign 设置节点数组的对齐方式]
 * @param {[type]} nodes [节点数组]
 * @param {[type]} type  [对齐类型]
 */
SVGSVGElement.prototype.setAlign=function(nodes,type){
	var L=nodes.length;
	if(L==0){return this;}
	var box0=nodes[0].getOutBBox();
	var minLeft=box0.x;
	var maxRight=box0.x+box0.width;
	var minTop=box0.y;
	var maxBottom=box0.y+box0.height;
	var midx=0;
	var midy=0;
	for(var i=0;i<=L-1;i++){
		var box=nodes[i].getOutBBox();
		minLeft=Math.min(minLeft,box.x);
		maxRight=Math.max(maxRight,box.x+box.width);
		minTop=Math.min(minTop,box.y);
		maxBottom=Math.max(maxBottom,box.y+box.height);
		midx=midx+(box.x+box.width/2);
		midy=midy+(box.y+box.height/2);
	}
	midy=midy/L;
	midx=midx/L;

	for(var i=0;i<=L-1;i++){
		var box=nodes[i].getOutBBox();
		var x=box.x;
		var y=box.y;
		var w=box.width;
		var h=box.height;
		switch(type){
			case "left":{
				nodes[i].translate(minLeft-x,0);
				break;
			}
			case "right":{
				nodes[i].translate(maxRight-x-w,0);
				break;
			}
			case "top":{
				nodes[i].translate(0,minTop-y);
				break;
			}
			case "bottom":{
				nodes[i].translate(0,maxBottom-y-h);
				break;
			}
			case "hcenter":{
				nodes[i].translate(0,midy-y-h/2);
				break;
			}
			case "vcenter":{
				nodes[i].translate(midx-x-w/2,0);
				break;
			}
		}
	}
}

/**
 * [showEightRange fixbug使用setTimeout，不知为何]
 * @param  {[type]} box   [box对象]
 * @param  {[type]} gnode [在目标盒子里显示选区]
 * @return {[type]}       [选区dom]
 */
SVGSVGElement.prototype.showRangeStr=function(box,gnode,flag){
	var svgroot=this;
	var pointA=svgroot.pointNode(box.x,box.y,gnode,true);
	var pointB=svgroot.pointNode(box.x+box.width,box.y,gnode,true);
	var pointC=svgroot.pointNode(box.x+box.width,box.y+box.height,gnode,true);
	var pointD=svgroot.pointNode(box.x,box.y+box.height,gnode,true);
	var rectBox=svgroot.envelope(pointA,pointB,pointC,pointD);
	var minx=rectBox.x;
	var miny=rectBox.y;
	var w=rectBox.width;
	var h=rectBox.height;
	console.log("showRange",box);
	var offsetX=[0,w/2,w,w,w,w/2,0,0];
	var offsetY=[0,0,0,h/2,h,h,h,h/2];
	var NS="http://www.w3.org/2000/svg";

	var html=[
		"<g class='eight-range' transform='translate("+minx+","+miny+")'>",
		'<rect x="0" y="0" width="'+w+'px" height="'+h+'px" stroke="black" stroke-width"="0.5px" fill="'+(flag? "blue":"none")+'" fill-opacity="'+(flag?"0.2":"0")+'"/>'
	];

	for(var i=0;i<=7;i++){
		var x=offsetX[i]-3;
		var y=offsetY[i]-3;
		var str='<rect x="'+x+'" y="'+y+'" width="6px" height="6px" stroke="black" stroke-width"="0.5px" fill="white" fill-opacity="1"/>';
		html.push(str);
	}
	html.push("</g>");
	setTimeout(function(){
		gnode.addStringSvgData("last",html.join(""));	
	},0);
	return gnode;
}

SVGSVGElement.prototype.showRange=function(box,gnode,flag){
	var range=document.querySelector("svg g.eight-range");
	if(range){
		range.remove();
	}
	var svgroot=this;
	var pointA=svgroot.pointNode(box.x,box.y,gnode,true);
	var pointB=svgroot.pointNode(box.x+box.width,box.y,gnode,true);
	var pointC=svgroot.pointNode(box.x+box.width,box.y+box.height,gnode,true);
	var pointD=svgroot.pointNode(box.x,box.y+box.height,gnode,true);
	var rectBox=svgroot.envelope(pointA,pointB,pointC,pointD);
	var minx=rectBox.x;
	var miny=rectBox.y;
	var w=rectBox.width;
	var h=rectBox.height;
	console.log("showRange",box);
	var offsetX=[0,w/2,w,w,w,w/2,0,0];
	var offsetY=[0,0,0,h/2,h,h,h,h/2];
	var NS="http://www.w3.org/2000/svg";
	var tempg=document.createElementNS(NS,"g");
	tempg.setAttr({
		"transform":"translate("+minx+","+miny+")",
		"class":"eight-range"
	});
	
	setTimeout(function(){
		gnode.appendChild(tempg);
		gnode.lastChild.addElement("rect",{
			"class":"mask-rect",
			"x":"0px",
			"y":"0px",
			"width":w+"px",
			"height":h+"px",
			"stroke":"black",
			"stroke-width":"0.5px",
			"fill":flag? "blue":"none",
			"fill-opacity":flag?"0.2":"0"
		});

		for(var i=0;i<=7;i++){
			var x=offsetX[i]-3;
			var y=offsetY[i]-3;
			var attr={
				"x":x+"px",
				"y":y+"px",
				"width":"6px",
				"height":"6px",
				"stroke":"black",
				"stroke-width":"0.5px",
				"fill":"white",
				"fill-opacity":"1"
			};
			gnode.lastChild.addElement("rect",attr);
		}		
	},0);
	return tempg;
}

/**
 * [hideRange 隐藏选区]
 * @return {[type]} [description]
 */
SVGSVGElement.prototype.hideRange=function(){
	var range=document.querySelector("svg g.eight-range");
	if(range){
		range.remove();
	}
}

/**
 * [showRange 显示选区]
 * @param  {[type]} gnode [目标盒子里显示选区]
 * @return {[type]}   [description]
 */
SVGElement.prototype.showEightRange=function(gnode){
	var gname=gnode.nodeName;
	if(gname!=="g"&&gname!=="svg"){return this;}
	var svgroot=this.ownerSVGElement;
	svgroot.hideRange();
	var box=this.getOutBBox();
	var svgroot=this.ownerSVGElement;
	return svgroot.showRange(box,gnode,false);
}

/**
 * [drag 单个svg元素的拖动封装]
 * @param  {[type]} start [开始回调]
 * @param  {[type]} move  [移动回调]
 * @param  {[type]} end   [结束回调]
 * @return {[type]}       [自身]
 */
SVGElement.prototype.drag=function(start,move,end){
	var self=this;
	var mousedown=false;
	var point0,x0,y0,cm,pm,rm;
	var svgroot=this.ownerSVGElement;

	this.addEventListener("mousedown",function(evt){
		mousedown=true;
		x0=evt.clientX;
		y0=evt.clientY;
		cm=this.getScreenCTM();
		pm=this.parentNode.getScreenCTM();
		rm= pm.inverse().multiply(cm);
		start&&start(evt);
		evt.preventDefault();
		evt.stopPropagation();
	});

	svgroot.addEventListener("mousemove",function(evt){
		if(mousedown){
			var tm=svgroot.createSVGMatrix();
			tm.e=evt.clientX-x0;
			tm.f=evt.clientY-y0;
			var M=pm.inverse().multiply(tm).multiply(pm).multiply(rm);
			var mstr=[M.a,M.b,M.c,M.d,M.e,M.f].join(",");
			var str="matrix("+mstr+")";
			self.setAttribute("transform",str);
			evt.preventDefault();
			evt.stopPropagation();
			move&&move(evt);
		}
	});

	this.addEventListener("mouseup",function(evt){
		mousedown=false;
		evt.preventDefault();
		evt.stopPropagation();
		end&&end(evt);
	});
	return this;
}

/**
 * [addText 添加矢量文本，foreignObject+div方式实现]
 * @param {[type]} text [description]
 * @param {[type]} obj  [description]
 */
SVGElement.prototype.addText=function(text,obj){
	var name=this.nodeName;
	if(name!=="g"&&name!=="svg"){return this;}
	var param={x:obj.x,	y:obj.y};
	var dom=this.addElement("foreignObject",param);
	dom.setAttr({"class":"foreignObject-text"});
	var NS = "http://www.w3.org/1999/xhtml";
	var div = document.createElementNS(NS, "div");
	var cssText=obj.cssText;
	div.setAttribute("style",cssText+";white-space:nowrap;");
	div.innerHTML=text;
	dom.appendChild(div);
	return dom;
}


