// score
var MAX_SCORE = 9999999;
var SCORE_X = 180;
var ENEMY_SCORE = [100,200,400,800,1000,2000,4000,8000,10000];
var ENEMY_SCORE_WIDTH = 12;
var ENEMY_SCORE_HEIGHT = 9;
var SCORE_UP_COUNT = 35;
// map
var MAP_NONE = 0;
var MAP_ONE = 1;
var MAP_TWO = 2;
var MAP_THREE = 3;
var MAP_TIME = 200;
var DOCAN_LEFT = 0;
var DOCAN_RIGHT = 1;
var DOCAN_UP = 2;
var DOCAN_DOWN = 3;
var DOCAN_NOT_MOVE = -100;
// mapchip
var NOT_DRAW_MIN = 0;		// 背景として描画しない範囲
var NOT_DRAW_MAX = 1;		// 背景として描画しない範囲


var g_Score = 0;
var g_MapStage = MAP_ONE;


var MAX_KURIBO = 32;
var MAX_ANIM = 4 * 32;

var g_Canvas;
var g_Ctx;
var g_Scene;	// シーン
var g_bLoaded;	// ロード

var g_bSpacePush = false;   // spaceキーフラグ
var g_bLeftPush = false;	// left
var g_bRightPush = false;	// right
var g_bUpPush = false;		// up
var g_bDownPush = false;	// down
var g_bAPush = false;	   // Aキーフラグ
var g_bEnterPush = false;   // リターンキーフラグ
var g_bEnterPushOne = false;// リターンが押されたときのみ立つフラグ

var g_LastAnimationFrameTime = 0,
g_LastFpsUpdateTime = 0,
g_FpsElement;

var g_MarioTex;
var g_MapTex;
var g_EnemyTex;
var g_ScoreTex;
var g_EnemyScoreTex;

var g_cMario;
var g_cKuribo = [];


var g_TempMap = []; // ステージテンポラリーマップ

var g_MapChip = [];
var g_Sub1Map = []; // ステージ1-1-A
var g_Sub2Map = []; // ステージ1-1-B

// 背景画像
var g_BackChip1 = []; // 地上
var g_BackChip2 = []; // 地下



var g_Kuribo_cou = 0;

/*
	アニメーション
*/
var g_AnimCnt = 0;
var ANIM_CHANGE;
var g_MapAnim = 0;

/*
	定数
*/
var LOAD = 1;
/*
	onload
	
	最初に呼び出される関数
*/

var g_csvs = [
	"g_BackChip1",
	"g_BackChip2",
	"g_MapChip",
	"g_Sub1Map",
	"g_Sub2Map"
];

window.onload = function() {
	getCSVs(0);

	function getCSVs(ind){
		let req = new XMLHttpRequest();
		req.onload = function(){
			convertCSVtoArray(ind, req.responseText);
		}
		req.open("get", "csv/"+ g_csvs[ind] +".csv", true);
		req.send();
	}
	function convertCSVtoArray(ind, str){
		let tmp = str.split("\n");
		for(let i=0,li=tmp.length-1;i<li;i++){
			eval(g_csvs[ind] +"[i] = tmp[i].split(',').map( str => parseInt(str, 10) );");
		}

		ind++;
		if(g_csvs.length > ind){
			getCSVs(ind);
		}
		else{
			doMain();
		}
	}
}



//window.onload = function() {
function doMain(){
	g_TempMap = g_MapChip.slice();
	// キャンバスに代入
	g_Canvas = document.getElementById('id_canvas1');
	g_FpsElement = document.getElementById("fps");	

	g_Ctx = g_Canvas.getContext('2d');
	
	g_Scene = LOAD;
	g_bLoaded = false;
	
	// クラス生成
	g_cMario = new cMario();
	g_cMario.Init(0,416);
	// 9.追加(クリボ)
	for(var i = 0;i < MAX_KURIBO;++i)
	{
		g_cKuribo[i] = new cKuribo();
	}

	LoadTex();
	Init();
	requestNextAnimationFrame(animate);
	// キーの登録
	window.addEventListener('keydown', KeyDown, true);	 
	window.addEventListener('keyup', KeyUp, true);
};

/*
	変数などの初期化
*/
function Init(){
	// クリボーの位置
	CreateEnemy(mapOnLoad("main"));

	// map
	g_MapAnim = 0;
	ANIM_CHANGE = 8;
	g_TempMap = g_MapChip.slice();
}

function InitStage(){
	// クリボーの位置
	CreateEnemy(mapOnLoad("main"));
	
	// map
	g_MapAnim = 0;
	ANIM_CHANGE = 8;

	g_MapChip = g_TempMap.slice();
}

/*
	LoadTex
	
	テクスチャのロード
*/
function LoadTex(){
	g_MarioTex = new Image();
	g_MarioTex.src = "img/Mario.png";
	g_MapTex = new Image();
	g_MapTex.src = "img/mapchip2.png";
	g_EnemyTex = new Image();
	g_EnemyTex.src = "img/enemy.png";
	g_ScoreTex = new Image();
	g_ScoreTex.src = "img/white_number.png";
	g_EnemyScoreTex = new Image();
	g_EnemyScoreTex.src = "img/enemy_score.png";
	g_bLoaded = true;
}

function mapOnLoad(type){
	switch(type){
		case "main":
			switch(g_MapStage){
				case MAP_ONE:
					map = g_MapChip;
					break;
				case MAP_TWO:
					map = g_Sub1Map;
					break;
				case MAP_THREE:
					map = g_Sub2Map;
					break;
			}
			break;
		case "back":
			switch(g_MapStage){
				case MAP_ONE:
				case MAP_TWO:
					map = g_BackChip1;
					break;
				case MAP_THREE:
					map = g_BackChip2;
					break;
			}
			break;
	}
	return map;
}

function animate(now) { 
	var fps = calculateFps(now);
	let map = mapOnLoad("main");
	Draw(map);		// 描画
	MapAnim();	// マップアニメーション
	
	
	if(g_cMario.State < DEAD_ACTION)
	{
		g_cMario.Move(g_bRightPush,g_bLeftPush,g_bSpacePush,g_bUpPush,g_bDownPush,map);
		g_cMario.BlockAction(map);		// 6.ブロックの破壊アニメーション
		
		g_cMario.DocanMove(120);				// 15.土管アクション
		
		// 土管
		if(g_bRightPush){
			switch(g_MapStage){
				case MAP_ONE:
					break;
				case MAP_TWO:
					break;
				case MAP_THREE:
					g_cMario.DocanEnter(14*32, 11*32, 32, 32, MAP_TWO,  DOCAN_RIGHT,163*32+16,17*32,163*32+16,11*32);
					break;

			}
		}
		else if(g_bLeftPush){
			switch(g_MapStage){
				case MAP_ONE:
					break;
				case MAP_TWO:
					break;
				case MAP_THREE:
					break;

			}
		}
		else if(g_bDownPush){
			switch(g_MapStage){
				case MAP_ONE:
					g_cMario.DocanEnter( 9*32+2, 11*32, 32, 32, MAP_TWO,  DOCAN_DOWN,   0*32+16,17*32,  0*32+16,11*32);
					break;
				case MAP_TWO:
					g_cMario.DocanEnter( 0*32+2, 11*32, 32, 32, MAP_ONE,  DOCAN_DOWN,   9*32+16,17*32,  9*32+16,11*32);
					g_cMario.DocanEnter(58*32+2,  9*32, 32, 32, MAP_THREE,DOCAN_DOWN,   2*32+16,-2*32,  2*32+16,-1*32);
					break;
				case MAP_THREE:
					break;

			}
		}
	}
	g_cMario.DeadAction();
	// 死亡戻り処理
	if(g_cMario.DeadBack()){
		// 初期化
		InitStage();
	}
	
	// enemy
	for(var i = 0;i < MAX_KURIBO;++i){
		g_cKuribo[i].Move(map,99,g_cMario.MoveNumX);
		g_cKuribo[i].Collision(g_cMario,map);
	}
	
	requestNextAnimationFrame(animate);
 } 
		   
/*
	Draw
	
	全般描画
*/
function Draw(map){
	g_Ctx.clearRect(0,0,640,480);
	DrawBackMap(mapOnLoad("back"));
	g_cMario.Draw(g_Ctx,g_MarioTex,2,2);
	
	DrawMap(map);

	for(var i = 0;i < MAX_KURIBO;++i){
		g_cKuribo[i].Draw(g_Ctx,g_EnemyTex,g_cMario.MapScrollX);
	}
	if(g_Score > MAX_SCORE){
		g_Score = MAX_SCORE;
	}
	DrawScore(SCORE_X,10,g_Score);
}

/*
	スコアの描画
*/
function DrawScore(posX,posY,score){
	var digits = CheckDigits(score);	// スコアの桁数
	var num = NumBack(score);			// スコアの最大桁数(11111 = 10000)
	var number = score;
	var numberPosX = posX - (digits * 25);
	while(num >= 1){
		g_Ctx.drawImage(g_ScoreTex, Math.floor((number / num )) * 20,0,20,17, numberPosX,posY, 20, 17);
		number -= Math.floor((number / num)) * num;				// 一番上の桁数を引く(111だったら100を引く)
		num = Math.floor(num / 10);		// 111 = 11にする
		numberPosX += 25;
	}	
}

/*
	敵用スコアの描画
*/
function DrawEnemyScore(posX,posY,score){
	var digits = CheckDigits(score);	// スコアの桁数
	var num = NumBack(score);			// スコアの最大桁数(11111 = 10000)
	var number = score;
	var numberWidth = digits * ENEMY_SCORE_WIDTH;
	// キャラの全長からスコアの半分を消す
	var numberPosX = posX - (numberWidth / 2);
	while(num >= 1){
		g_Ctx.drawImage(g_EnemyScoreTex, Math.floor((number / num )) * 10,0,10,9, numberPosX,posY, 10, 9);
		number -= Math.floor((number / num)) * num;				// 一番上の桁数を引く(111だったら100を引く)
		num = Math.floor(num / 10);		// 111 = 11にする
		numberPosX += ENEMY_SCORE_WIDTH;
	}
}

/*
	一番上の桁数字を返す

	number = 対象となる数字
*/
function NumBack(number){
	var digits = 1;
	while (1) {
		number /= 10;
		if(Math.floor(number) < 1)break;
		digits *= 10;
	}
	return digits; // 最上位数を返す
}

/*
	与えられた数字の桁数を返す
	number = 桁数を返す数字
*/
function CheckDigits(number) {
	if(number == NaN)return 0;
	var digits = 1;
	while (1) {
		number /= 10;
		if(Math.floor(number) < 1)break;
		digits++;
	}
	return digits;		// 桁数を返す
}

/*
	マップチップの描画
*/
function DrawMap(map){
	for(var i = 0;i < 15;++i){
		for(var j = g_cMario.MinMapX;j < g_cMario.MaxMapX;++j){
			// 背景は描画しない
			if(map[i][j] > NOT_DRAW_MAX){
				// animation
				if(map[i][j] == FCOIN_MAP){
					g_Ctx.drawImage(g_MapTex, 32 * ((map[i][j] + 16) % 16) + g_MapAnim, 32 * Math.floor(map[i][j] / 16) , 32, 32, j * 32 -  g_cMario.MapScrollX, i * 32, 32, 32);
				}
				else if(map[i][j] >= OBJECT_MAP && map[i][j] <= BLOCK_MAP - 1){
					g_Ctx.drawImage(g_MapTex, 32 * ((map[i][j] + 16) % 16) + g_MapAnim, 32 * Math.floor(map[i][j] / 16) , 32, 32, j * 32 -  g_cMario.MapScrollX, i * 32, 32, 32);
				}
				else if(map[i][j] == COIN_MAP){
					
				}
				// not animation 
				else {
					// 512*512
					g_Ctx.drawImage(g_MapTex, 32 * ((map[i][j] + 16) % 16), 32 * Math.floor(map[i][j] / 16) , 32, 32, j * 32 -  g_cMario.MapScrollX, i * 32, 32, 32);
				}
			}
			//g_Ctx.drawImage(g_MapTex, 32 * ((map[i][j] + 16) % 16), 32 * Math.floor(map[i][j] / 16) , 32, 32, j * 32, i * 32, 32, 32);
		}
	}
	// 6.追加
	// 壊れたブロックの描画
	for(var i = 0;i < MAX_BLOCK;++i){
		if(g_cMario.bBlockAtack[i])
		{
			g_Ctx.drawImage(g_MapTex, 128, 160 , 16, 16, g_cMario.BlockPosX[i][1] - g_cMario.MapScrollX,g_cMario.BlockPosY[i][1], 16, 16);	// 左上
			g_Ctx.drawImage(g_MapTex, 144, 160 , 16, 16, g_cMario.BlockPosX[i][3] - g_cMario.MapScrollX,g_cMario.BlockPosY[i][3], 16, 16);	// 右上
			g_Ctx.drawImage(g_MapTex, 144, 176 , 16, 16, g_cMario.BlockPosX[i][2] - g_cMario.MapScrollX,g_cMario.BlockPosY[i][2], 16, 16);	// 右下
			g_Ctx.drawImage(g_MapTex, 128, 176 , 16, 16, g_cMario.BlockPosX[i][0] - g_cMario.MapScrollX,g_cMario.BlockPosY[i][0], 16, 16);	// 左下
		}
		// ブロックの上昇描画
		if(g_cMario.bBlockUp[i])
		{
			g_Ctx.drawImage(g_MapTex, 0, 0 , 32, 32, g_cMario.BlockAtackX[i] - g_cMario.MapScrollX,g_cMario.BlockAtackPosY[i], 32, 32);		// 背景で塗りつぶす
			g_Ctx.drawImage(g_MapTex, 128, 160 , 32, 32, g_cMario.BlockAtackX[i] - g_cMario.MapScrollX,g_cMario.BlockAtackPosY[i] - g_cMario.BlockAtackAddY[i], 32, 32);	// ブロック上昇
		}
	}
	
	// 8.追加
	// ブロックを叩いた後のコインの描画
	for(var i = 0;i < MAX_COIN;++i){
		if(g_cMario.bCoin[i])
		{
			g_Ctx.drawImage(g_MapTex, 384, 96 , 32, 32, g_cMario.CoinX[i] - g_cMario.MapScrollX,g_cMario.CoinY[i], 32, 32);
		}
	}
	
	// 赤キノコの描画
	if(g_cMario.bRKinoko)
	{
		g_Ctx.drawImage(g_MapTex, 0, 480 , 32, 32, g_cMario.RKinokoX - g_cMario.MapScrollX,g_cMario.RKinokoY, 32, 32);
	}
	// 1Upキノコの描画
	if(g_cMario.bGKinoko)
	{
		g_Ctx.drawImage(g_MapTex, 64, 480 , 32, 32, g_cMario.GKinokoX - g_cMario.MapScrollX,g_cMario.GKinokoY, 32, 32);
	}
}

/*
	背景の描画(15.docan)
*/
function DrawBackMap(map){
	let scl1 = (g_cMario.MapScrollX / 4)|0;
	let scl2 = (g_cMario.MapScrollX / 43)|0;//43
	for(var i = 0;i < 15;++i){
		for(var j = g_cMario.MinMapX-scl2-4;j < g_cMario.MaxMapX-scl2;++j){
			// 512*512
			g_Ctx.drawImage(g_MapTex, 32 * ((map[i][j] + 16) % 16), 32 * Math.floor(map[i][j] / 16) , 32, 32, j * 32 -  /*g_cMario.MapScrollX*/+scl1, i * 32, 32, 32);			
		}
	}
}

/*
	敵の設置
*/
function CreateEnemy(map){
	g_Kuribo_cou = 0;
	for(let i = 0;i < 15;++i){
		for(let j=0,lj=map[i].length;j<lj;++j){
			// 背景などは描画しない
			if(map[i][j] < NOT_DRAW_MIN){
				if(map[i][j] == KURIBO_MAP){
					g_cKuribo[g_Kuribo_cou].Init(j*32,i*32,LEFT_DIR);
					g_Kuribo_cou++;
				}
			}
		}
	}
	for(let i = g_Kuribo_cou;i < MAX_KURIBO;++i){
		g_cKuribo[i].Init(0,0,LEFT_DIR);
		g_cKuribo[i].State = DEAD_ACTION;
	}
	console.log(g_Kuribo_cou);
}


function MapAnim(){
	if(++g_AnimCnt >= ANIM_CHANGE){
		g_AnimCnt = 0;
		g_MapAnim += 32;
		if(g_MapAnim >= MAX_ANIM){
			g_MapAnim = 0;
		}
	};
}


function KeyDown(event) {
	var code = event.keyCode;
	switch(code) {
		case 32: // スペースキー
		case 76: // Lキー
			// スクロールさせないため
			event.returnValue = false;
			event.preventDefault();
			g_bSpacePush = true;
			break;
		case 37: // ←キー
		case 65: // Aキー
			event.returnValue = false;
			event.preventDefault();
			g_bLeftPush = true;
			break;
		case 39: // →キー
		case 68: // Dキー
			event.returnValue = false;
			event.preventDefault();
			g_bRightPush = true;
			break;
		case 38: // ↑キー
		case 87: // Wキー
		case 75: // Kキー
			event.returnValue = false;
			event.preventDefault();
			g_bUpPush = true;
			break;
		case 40: // ↓キー
		case 83: // Sキー
			event.returnValue = false;
			event.preventDefault();
			g_bDownPush = true;
			break;

		case 66: // bキー
			g_bAPush = true;
			break;
		case 67: cキー
			// 一回のみのプッシュ
			if(g_bEnterPush){
				g_bEnterPushOne = false;
			}
			else{
				g_bEnterPushOne = true;
			}
			g_bEnterPush = true;	
			break;
	}
}

function KeyUp(event) {
	code = event.keyCode;
	switch(code) {
		case 32: // スペースキー
		case 76: // Lキー
			g_bSpacePush = false;
			break;
		case 37: // ←キー
		case 65: // Aキー
			g_bLeftPush = false;
			break;
		case 39: // →キー
		case 68: // Dキー
			g_bRightPush = false;
			break;
		case 38: // ↑キー
		case 87: // Wキー
		case 75: // Kキー
			g_bUpPush = false;
			break;
		case 40: // ↓キー
		case 83: // Sキー
			g_bDownPush = false;
			break;

		case 66: // bキー
			g_bAPush = false;
			break;
		case 67: // cキー
			g_bEnterPush = false;
			g_bEnterPushOne = false;
			break;

	}
}

function rightClick(){
	g_bRightPush = true;
}

function rightUp(){
	g_bRightPush = false;
}

function leftClick(){
	g_bLeftPush = true;
}

function leftUp(){
	g_bLeftPush = false;
}

function downClick(){
	g_bDownPush = true;
}

function downUp(){
	g_bDownPush = false;
}

function topClick(){
	g_bUpPush = true;
}

function topUp(){
	g_bUpPush = false;
}

function aClick(){
	g_bAPush = true;
	g_bUpPush = true;
}

function aUp(){
	g_bAPush = false;
	g_bUpPush = false;
}

function bClick(){
	g_bSpacePush = true;
}

function bUp(){
	g_bSpacePush = false;
}


window.requestNextAnimationFrame = (function(){
	var originalWebkitRequestAnimationFrame = undefined,
		wrapper = undefined,
		callback = undefined,
		geckoVersion = 0,
		userAgent = navigator.userAgent,
		index = 0,
		self = this;

	// Workaround for Chrome 10 bug where Chrome
	// does not pass the time to the animation function

	if (window.webkitRequestAnimationFrame) {
		// Define the wrapper

		wrapper = function(time) {
			if (time === undefined) {
				time = +new Date();
			}
			self.callback(time);
		};

		// Make the switch

		originalWebkitRequestAnimationFrame = window.webkitRequestAnimationFrame;	

		window.webkitRequestAnimationFrame = function (callback, element) {
			self.callback = callback;

			// Browser calls the wrapper and wrapper calls the callback

			originalWebkitRequestAnimationFrame(wrapper, element);
		}
	}

	// Workaround for Gecko 2.0, which has a bug in
	// mozRequestAnimationFrame() that restricts animations
	// to 30-40 fps.

	if (window.mozRequestAnimationFrame) {
  
		index = userAgent.indexOf('rv:');

		if (userAgent.indexOf('Gecko') != -1) {
			geckoVersion = userAgent.substr(index + 3, 3);

			if (geckoVersion === '2.0') {

				window.mozRequestAnimationFrame = undefined;
			}
		}
	}

	return window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame

		|| function (callback, element) {
			var start, finish;

			 window.setTimeout(function(){
				start = +new Date();
				callback(start);
				finish = +new Date();

				self.timeout = 1000 / 60 - (finish - start);

			}, self.timeout);
		};
})();

function calculateFps(now) {
	var fps = 1000 / (now - g_LastAnimationFrameTime);
	g_LastAnimationFrameTime = now;

	if (now - g_LastFpsUpdateTime > 1000) {
		g_LastFpsUpdateTime = now;
		g_FpsElement.innerHTML = fps.toFixed(0) + ' fps';
	}
	return fps; 
}
