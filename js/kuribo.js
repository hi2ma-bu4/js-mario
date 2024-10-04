// 定数
var LEFT_DIR =  1;	
var RIGHT_DIR = -1;
var MAX_DOWN_SPEED = 9;					// 落下スピード

// 状態
var ALIVE = 1;


var MAX_GRAVITY = 10;		// 最大落下速度


// map
var MAP_MAX = 4;			// 上右、下右、下左、上左の順に数値を入れる
var OBJECT_MAP = 64;		// オブジェクトとなるマップ番号


/*
	kuriboクラス
*/
function cKuribo(){	
	// 変数(座標)
	this.bMove;					// 移動フラグ
	this.PosX;					// x座標
	this.PosY;					// y座標
	this.AddNumY;				// yの加算量
	this.AddNumX;				// x座標移動加算量
	this.Dir;					// 向いている方向
	this.AnimX;					// アニメーションX
	this.AnimCnt;				// アニメーションカウント
	this.MapX = [];				// マップ位置X(上右、下右、下左、上左の順に数値を入れる)
	this.MapY = [];				// マップ位置Y(上右、下右、下左、上左の順に数値を入れる)
	this.State;				// マリオの状態(小さいとか、キノコをとったとか)
	this.IndexPoint;		// 当たり判定の頂点の数
	this.AddScore;			// 加算表示スコア
	this.ScoreUpY;			// スコア上昇
	this.ScoreUpCnt;		// スコア上昇カウンター
}

/*
	初期化関数
*/
cKuribo.prototype.Init = function(x,y,dir){
	this.bMove = false;
	this.PosX = x;
	this.PosY = y;
	this.AddNumY = 0;			// y加算量
	this.Dir = dir;
	this.AddNumX = 2;
	this.AnimX = 0;
	this.AnimCnt = 0;			// アニメーションカウント
	// マップ変数
	this.MapX[0] = Math.floor((this.PosX + 31) / 32);	// 0-32で0,33-64で1(右)
	this.MapX[1] = this.MapX[0];	// 右
	this.MapX[2] = Math.floor((this.PosX) / 32);	// 左
	this.MapX[3] = this.MapX[2];		// 左
	// Y
	this.MapY[0] = Math.floor((this.PosY) / 32);	// 0-32で0,33-64で1(上)
	this.MapY[1] = Math.floor((this.PosY + 31) / 32);	// 0-32で0,33-64で1(下)
	this.MapY[2] = this.MapY[1];						// 0-32で0,33-64で1(下)
	this.MapY[3] = this.MapY[0];						// 0-32で0,33-64で1(上)
	this.State = ALIVE;			// 状態
	// score
	this.AddScore = 0;			// 加算表示スコア
	this.ScoreUpY = 0;			// スコア上昇処理
	this.ScoreUpCnt = 0;		// スコア上昇カウンター
}

/*
	描画
*/
cKuribo.prototype.Draw = function(img,tex,scrollX){
	if(this.bMove)
	{		
		if(this.Dir == LEFT_DIR)
		{
			img.save();
			img.transform(-1, 0, 0, 1, 0, 0);
			img.drawImage(tex, this.AnimX, 64, 32, 32, -this.PosX - 32 + scrollX, this.PosY, 32, 32);
			img.restore();
		}
		else
		{
			img.drawImage(tex, this.AnimX, 64, 32, 32, this.PosX - scrollX, this.PosY, 32, 32);
		}
	}
	if(this.State == DEAD_ACTION){
		this.DrawScore(scrollX);
	}
}

/*
	score 描画
*/
cKuribo.prototype.DrawScore = function(scrollX){
	//DrawScore(this.PosX - scrollX,this.PosY + this.ScoreUpY,this.AddScore);
	DrawEnemyScore(this.PosX - scrollX + 16,this.ScoreUpY,this.AddScore);
}

/*
	動き
	
	posX = メインキャラのX座標
*/
cKuribo.prototype.Move = function(map,maxX,posX){
	if(this.State < DEAD_ACTION)
	{
		if(this.bMove)
		{
			// アニメーション
			{
				// 何回でアニメーションを変えるか
				if(this.AnimCnt++ >= 20)
				{
					if(this.AnimX == 0)
					{	
						this.AnimX = 32;	// 次のコマへ
					}
					else
					{
						this.AnimX = 0;
					}
					this.AnimCnt = 0;
				}
			}
			// 移動
			if(this.Dir == LEFT_DIR)
			{
				this.AddNumX = 2;
				this.CollisionX(map,this.PosX - this.AddNumX);		// オブジェクトとの当たり判定
				this.PosX -= this.AddNumX;
			}
			else
			{
				this.AddNumX = 2;
				this.CollisionX(map,this.PosX + this.AddNumX);		// オブジェクトとの当たり判定
				this.PosX += this.AddNumX;
			}
			// マップ座標
			{
				this.MapX[0] = Math.floor((this.PosX + 31) / 32);	// 0-32で0,33-64で1(右)
				this.MapX[1] = this.MapX[4] = this.MapX[0];	//   右
				this.MapX[2] = Math.floor(this.PosX / 32);	// 左
				this.MapX[3] = this.MapX[5] = this.MapX[2];		// 左
				// 配列外処理
				if(this.MapX[0] > maxX)
				{
					this.MapX[0] = this.MapX[1] = this.MapX[4] = maxX;
				}
				if(this.MapX[2] >= maxX)
				{
					this.MapX[2] = this.MapX[3] = this.MapX[5]= maxX;
				}
				if(this.MapX[0] < 0)
				{
					this.MapX[0] = this.MapX[1] = this.MapX[4] = 0;
				}
				if(this.MapX[2] < 0)
				{
					this.MapX[2] = this.MapX[3] = this.MapX[5] = 0;
				}
			}
			
			// 重力処理
			{	
				this.AddNumY -= 1;
				// 最大落下速度
				if(this.AddNumY < -MAX_GRAVITY)
				{
					this.AddNumY = -MAX_GRAVITY;
				}			
				this.CollisionY(map,this.PosY - this.AddNumY);
				this.PosY -= this.AddNumY;		// 上昇
				this.DefineMapY(14);			
			}
		}
		else
		{
			// 一定距離に近づいたら、動くフラグを立てる
			if(Math.abs(posX - this.PosX) <= 640)this.bMove = true;
		}
	}
	// 死亡処理
	else if(this.State == DEAD_ACTION)
	{
		this.AddNumY += 1;
		this.PosY += this.AddNumY;
		this.ScoreUpY--;
		this.ScoreUpCnt++;
		if(this.PosY > 480 && this.ScoreUpCnt >= SCORE_UP_COUNT)
		{
			this.State = DEAD;
			this.bMove = false;
			this.ScoreUpCnt = 0;
		}
	}
}


/*
	mainキャラクターとの当たり判定
	
	mario = メインキャラクターのクラス
*/
cKuribo.prototype.Collision = function(mario,map){
	if(this.State < DEAD_ACTION && mario.State < DEAD_ACTION)
	{
		// x軸
		if(mario.MoveNumX < this.PosX + 32 && mario.MoveNumX + 32 > this.PosX)
		{
			// y軸踏みつけ判定(踏みつけ側の下座標が、踏みつけられる側の中間座標よりも上ならば踏みつける)
			if(mario.PosY + (mario.Height - 32) <= this.PosY - 16 && mario.PosY + (mario.Height - 32) >= this.PosY - 32)
			{
				this.State = DEAD_ACTION;		// 死亡演出
				// キャラクターを上昇させる
				mario.AddNumY = 9;
				mario.CollisionY(map,mario.PosY - this.AddNumY);
				mario.PosY -= mario.AddNumY;		// 上昇
				mario.DefineMapY(14);			// マップ座標Yを決める
				this.AddScore = ENEMY_SCORE[mario.ScoreCount];
				g_Score += this.AddScore;
				this.ScoreUpY = this.PosY;
				// 1upで止める
				if(mario.ScoreCount+1 < ENEMY_SCORE.length) {
					mario.ScoreCount++;
				}
			}
			// キャラクター側が当たった
			else if(mario.PosY + (mario.Height - 32) >= this.PosY - 32 && mario.PosY - mario.Height <= this.PosY && !mario.bInvincible)
			{
				mario.EnemyCollision(map);
			}
		}
		
		// 11.下にいるブロックが叩かれたときの処理
		{
			for(var i = 0;i < MAX_BLOCK;++i){
				// 叩いたブロックのY座標(キノコなどマップが壊れて、下に下がった時に範囲を持たせる)
				if(mario.BlockAtackY[i] <= this.PosY + 32 && mario.BlockAtackY[i] >= this.PosY + 31)
				{
					// 叩いたブロックのX座標
					if(mario.BlockAtackX[i] < this.PosX + 30  && mario.BlockAtackX[i] + 30 > this.PosX)
					{
						this.AddNumY = 10;
					}
				}
			}
		}
	}
}

/*
	DefineMapY
	
	Y軸のマップ座標を決める
	
	maxY = Y軸の最大配列
*/
cKuribo.prototype.DefineMapY = function(maxY){
	this.MapY[0] = Math.floor((this.PosY) / 32);			// 0-32で0,33-64で1(上)
	this.MapY[1] = Math.floor((this.PosY + (31)) / 32);			// 0-32で0,33-64で1(下)
	this.MapY[2] = this.MapY[1];					// 0-32で0,33-64で1(下)
	this.MapY[3] = this.MapY[0];					// 0-32で0,33-64で1(上)
	// 配列外対策(上)
	if(this.MapY[0] > maxY)
	{
		this.MapY[0] = this.MapY[3] = maxY;
	}
	// 配列外対策(下)
	if(this.MapY[1] > maxY)
	{
		this.MapY[1] = this.MapY[2] = 14;
	}
	// 画面下配列外対策
	if(this.MapY[0] < 0)
	{
		this.MapY[0] = this.MapY[3] = 0;
	}
	// 配列外対策(下)
	if(this.MapY[1] < 0)
	{
		this.MapY[1] = this.MapY[2] = 0;
	}
}

/*
	オブジェクトとの当たり判定X
*/
cKuribo.prototype.CollisionX = function(map,posX){
	// マップ変数に移動後の座標を代入
	this.MapX[0] = Math.floor((posX + 31) / 32);	// 0-32で0,33-64で1(右)
	this.MapX[1] = this.MapX[0];	//   右
	this.MapX[2] = Math.floor(posX / 32);	// 左
	this.MapX[3] = this.MapX[2];		// 左
	// 配列外処理
	if(this.MapX[0] > 1000)
	{
		this.MapX[0] = this.MapX[1] = this.MapX[4] = 1000;
	}
	if(this.MapX[2] > 1000)
	{
		this.MapX[2] = this.MapX[3] = this.MapX[5] = 1000;
	}
	if(this.MapX[0] < 0)
	{
		this.MapX[0] = this.MapX[1] = this.MapX[4] =  0;
	}
	if(this.MapX[2] < 0)
	{
		this.MapX[2] = this.MapX[3] = this.MapX[5] = 0;
	}

	// キャラクターの四隅にオブジェクトが触れているかをチェック
	for(var i = 0;i < 4;++i){
		// キャラクター四隅のいずれかがオブジェクトに触れた
		if(map[this.MapY[i]][this.MapX[i]] >= OBJECT_MAP)
		{
			// (加算される前の)中心点からの距離を見る
			var vecX = Math.abs((this.PosX + 16) - ((this.MapX[i] * 32) + 16));
			// Xの加算量調整
			this.AddNumX = Math.abs(32 - vecX);
			// 方向変換
			if(this.Dir == LEFT_DIR)this.Dir = RIGHT_DIR;
			else this.Dir = LEFT_DIR;
			break;			// 一度判定したら抜ける
		}
	}	
}

/*
	オブジェクトとの当たり判定Y
	
	posY = yの加算量とポジションを足した値
	map = 対象となるマップ配列
*/
cKuribo.prototype.CollisionY = function(map,posY){
	this.MapY[0] = Math.floor((posY) / 32);			// 0-32で0,33-64で1(上)
	this.MapY[1] = Math.floor((posY + 31) / 32);			// 0-32で0,33-64で1(下)
	this.MapY[2] = this.MapY[1];					// 0-32で0,33-64で1(下)
	this.MapY[3] = this.MapY[0];					// 0-32で0,33-64で1(上)
	// 配列外対策(上)
	if(this.MapY[0] > 14)
	{
		this.MapY[0] = 14;
		this.MapY[3] = 14;
	}
	// 配列外対策(下)
	if(this.MapY[1] > 14)
	{
		this.MapY[1] = this.MapY[2] = 14;
	}
	// 画面下配列外対策
	if(this.MapY[0] < 0)
	{
		this.MapY[0] = 0;
		this.MapY[3] = 0;
	}
	// 配列外対策(下)
	if(this.MapY[1] < 0)
	{
		this.MapY[1] = this.MapY[2] = 0;
	}

	// キャラクターの四隅にオブジェクトが触れているかをチェック
	for(var i = 0;i < 4;++i){
		// キャラクター四隅のいずれかがオブジェクトに触れた
		if(map[this.MapY[i]][this.MapX[i]] >= OBJECT_MAP)
	 	{
			// 距離を見る
       		var vecY = ((this.PosY + 16) - ((this.MapY[i] * 32) + 16));
       		
       		// 上から当たっている
			if(vecY > 0)
			{
				// Yの加算量調整
				this.AddNumY = Math.abs(32 - vecY);
			}
			// 地面とされる位置についた
			else
			{
				this.PosY += Math.abs(32 + vecY);
				this.AddNumY = 0;
			}
		}
	}
}
