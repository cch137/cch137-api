import axios from "axios";
import htmlTableTo2DArray, { ParsedTable } from "./utils/htmlTableTo2DArray";

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76';

const testHTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>自然語言處理</title>
<link rel="stylesheet" href="/Course/css/table.css" type="text/css" />

</head>

<body>
<table class="classBase" cellspacing="0" cellpadding="1" width="100%">
  <tbody>
  <tr>
  	<th colspan="2">課程相關資訊</th>
  </tr>
	<tr>
      	<td class="subTitle" width="150">流水號  / 課號</td>
      	<td> 09058 / GS4518 - *</td>
    </tr>
	<tr>
      	<td class="subTitle">課程名稱/備註</td>
      	<td>自然語言處理<br />
      	<span class="engclass">Natural language processing</span>
      	</td>
    </tr>
	<tr>
      	<td class="subTitle">授課教師</td>
      	<td>
		
			李厚均 / LEE,HOU,CHUN <br />
		
		</td>
    </tr>
     <tr>
		<!-- 開課單位 -->
		<td class="subTitle">開課單位</td>
		<td>
			
				通識教育中心
			
			
			
			
		</td>
	</tr>
	 <tr>
		<!-- 課程學制 -->
		<td class="subTitle">課程學制</td>
		<td>
			
				學士班
			
			
			
		</td>
	</tr>
    <tr>
      	<td class="subTitle">時間/教室</td>
      	<td>
        
			 星期五 
			7 (15:00 - 15:50) |    
			 志希館  
			002 <br />
		
			 星期五 
			8 (16:00 - 16:50) |    
			 志希館  
			002 <br />
		
			 星期五 
			9 (17:00 - 17:50) |    
			 志希館  
			002 <br />
				</td>
    </tr> 
    <tr>
      	<td class="subTitle">選修別</td>
      	<td>
		選修
		</td>
    </tr> 
    <tr>
      	<td class="subTitle">學分</td>
      	<td>
		3
		</td>
    </tr>    
    <tr>
      	<td class="subTitle">全/半</td>
      	<td>
		半
		</td>
    </tr>    
	<tr>
      	<td class="subTitle">授課語言</td>
      	<td>
      	國語
      	</td>
    </tr>
	<tr>
      	<td class="subTitle">採用密碼卡</td>
      	<td>
      	部份使用
      	</td>
    </tr>
    <tr>
      	<td class="subTitle">人數限制</td>
      	<td>
      	
      		
      		50		
		
		</td>
    </tr>
    <tr>
      	<td class="subTitle">待分發人數</td>
      	<td>
		28
		</td>
    </tr>
    <tr>
      	<td class="subTitle">中選人數</td>
      	<td>
		50 <span class=notice>(額滿)</span>
		</td>
    </tr>
	<tr>
      	<td class="subTitle">備註</td>
      	<td>
      	
      	</td>
    </tr>
	<tr>
		<td class="subTitle">課程目標</td>
		<td><span class="courseObject">
			
				?? 對?然語?處理有基礎認識
?? 能使?NLP常?之套件去? 本資料
?? 了解NLP常?演算法
?? 了解近年來AI在?然語 ?處上的發展
			
			
		</span></td>
	</tr> 
	<tr>
		<td class="subTitle">授課內容</td>
		<td><span class="courseContent">
			
				1 Python程式語法/常<br />
?資料科學套件<br />
?編講義<br />
2 什麼是?然語?處<br />
理/?然語?處理的<br />
應?<br />
?編講義<br />
3 ?然語?前處理/?<br />
然語?開源軟體介<br />
紹<br />
?編講義<br />
4 機器學習基礎1 ?編講義<br />
5 機器學習基礎2 ?編講義<br />
3/4<br />
6 機器學習實作?章<br />
分析<br />
?編講義<br />
7 正規化表?法介紹/<br />
語法介紹<br />
?編講義<br />
8 深度學習介紹?編講義<br />
9 Word2vec詞向量<br />
part1<br />
?編講義<br />
10 Word2vec詞向量<br />
part2<br />
?編講義<br />
11 RNN的基礎架<br />
構/LSTM介紹<br />
?編講義<br />
12 Transformer與<br />
BERT介紹<br />
?編講義<br />
13 Line bot介紹1 ?編講義<br />
14 Line bot介紹2 ?編講義<br />
15 微軟Azure?字服務<br />
介紹<br />
?編講義<br />
16 使?微軟Azure實作<br />
?本分析1<br />
?編講義<br />
17 使?微軟Azure實作<br />
?本分析2<br />
?編講義<br />
18 課程總複習
			
			
		</span></td>
	</tr>
	<tr>
		<td class="subTitle">教科書/參考書</td>
		<td><span class="books">
			
				指定教科書
?編講義
參考書?
Natural Language Processing Fundamentals
https://www.tenlong.com.tw/products/978178 9954043
			
				
		</span></td>
	</tr>
	<tr>
		<!-- 自編教材比例 -->
		<td class="subTitle">自編教材比例	</td>
		<td>100</td>
	</tr>
	<tr>
		<td class="subTitle">授課方式</td>
		<td><span class="teachType">
			講授
			
			
			
			
		</span></td>
	</tr>
	<tr>
		<td class="subTitle">評量配分比重</td>
		<td><span class="courseWeight">
			
				期中考 20%
期末考 50%
作業 30%
			
			
		</span></td>
	</tr>
	<tr>
		<td class="subTitle">辦公時間</td>
		<td><span class="officeHour">
			
				與教師另?預約
			
			
		</span></td>
	</tr>
	<tr>
		<!-- 授課週數 -->
		<td class="subTitle">授課週數</td>
		<td>
			18
		</td>
	</tr>
	<tr>
		<!-- 彈性教學說明 -->
		<td class="subTitle">彈性教學說明</td>
		<td>
			
					
			
			
		</td>
	</tr>
	
	<tr>
		<td class="subTitle">課程領域</td>
		<td><span class="courseArea">
			
				應用科學領域
				
				
			
		</span></td>
	</tr>
	<!-- <tr>
		<td class="subTitle">跨系課程領域</td>
		<td><span class="crossCourseArea"></span></td>
	</tr>
	 -->  
	<tr>
		<td colspan=2>
			<table class="courseMap" style="margin-left:0px;">
				<tr>
					<!-- <th>系所核心能力</th>
					<th>強度指數</th>
					<th>評量方式</th>
					-->
					<td colspan="2">
						
						
						
						<table width="100%">
						<tr>
							<th>系所核心能力</th><th>強度指數</th>
							<th>評量方式</th>
						</tr>
						
						
						
						<tr>
							<td>
								
									邏輯與創新
										
										
							</td>
							<td>
							
								
								
									(5) 
									
										非常高
											
									
								
							
							</td>
							<td>
							
							
							
							
								
								
									
										紙筆測驗/會考
											
											
								
							
							，
							
							
							
								
								
									
										口頭報告/口試
											
											
								
							
							，
							
							
							
								
								
									
										實作/實驗
											
											
								
							
							
							
							
							</td>
						</tr>
						
						
						
						<tr>
							<td>
								
									多元與溝通
										
										
							</td>
							<td>
							
								
								
									(3) 
									
										普通
											
									
								
							
							</td>
							<td>
							
							
							
							
								
								
									
										紙筆測驗/會考
											
											
								
							
							，
							
							
							
								
								
									
										口頭報告/口試
											
											
								
							
							，
							
							
							
								
								
									
										實作/實驗
											
											
								
							
							
							
							
							</td>
						</tr>
						
						
						
						<tr>
							<td>
								
									美感與鑑賞
										
										
							</td>
							<td>
							
								
								
									(2) 
									
										低
											
									
								
							
							</td>
							<td>
							
							
							
							
								
								
									
										紙筆測驗/會考
											
											
								
							
							，
							
							
							
								
								
									
										口頭報告/口試
											
											
								
							
							，
							
							
							
								
								
									
										實作/實驗
											
											
								
							
							
							
							
							</td>
						</tr>
						
						
						
						<tr>
							<td>
								
									關懷與實踐
										
										
							</td>
							<td>
							
								
								
									(2) 
									
										低
											
									
								
							
							</td>
							<td>
							
							
							
							
								
								
									
										紙筆測驗/會考
											
											
								
							
							，
							
							
							
								
								
									
										口頭報告/口試
											
											
								
							
							，
							
							
							
								
								
									
										實作/實驗
											
											
								
							
							
							
							
							</td>
						</tr>
						
						
						</table>
						

					</td>
				</tr>
			</table>
		</td>
	</tr>  
  <tr>
  	<th colspan="2">分發條件</th>
  </tr>
  <tr>
  	<td colspan="2">
		
			
				          <table border='1' cellpadding='0' cellspacing='0' style='border-collapse: collapse' bordercolor='#111111' bgcolor='#FFFFFF' width='100%' id='AutoNumber1'>
             <tr>                <td width='10%' bgcolor='#CCCCFF' align='center'><font size='2'>優先順序</font></td>
                <td width='90%' bgcolor='#CCCCFF' align='center'><font size='2'>相關條件限制說明</font></td>
             </tr>
       <tr>           <td width='10%' bgcolor='#FFFFFF' align='center'><font size='2'>1           </font></td>
           <td width='90%' bgcolor='#FFFFFF' align='left'><font size='2'>系所:限學分學程-人工智慧跨域應用(理)、學分學程-人工智慧跨域應用(文)。           </font></td>
       </tr>       <tr>           <td width='10%' bgcolor='#FFFFFF' align='center'><font size='2'>2           </font></td>
           <td width='90%' bgcolor='#FFFFFF' align='left'><font size='2'>學制:限學士班。           </font></td>
       </tr>          </table>

			
		
		
  	</td>
  </tr>
  <tr>
  	<th colspan="2">修課名單</th>
  </tr>
  <tr>
  	<td colspan="2">



<table style="width:100%" id="std">
<thead>
<tr>
<th>#</th>
<th>學號</th>
<th>姓名</th>
<th>系所</th>
<th>年級班別</th>
<th>性別</th>
<th>選修別</th>
<th>志願序</th>
<th>選課狀態</th></tr></thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>企業管理學系</td>
<td>4-2</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>2</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>中國文學系</td>
<td>4</td>
<td>女</td>
<td>選修</td>
<td>4</td>
<td>待分發</td></tr>
<tr class="odd">
<td>3</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>光電科學與工程學系</td>
<td>4</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>4</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>土木工程學系</td>
<td>4-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選</td></tr>
<tr class="odd">
<td>5</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>土木工程學系</td>
<td>4-1</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>待分發</td></tr>
<tr class="even">
<td>6</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系設計與分析組</td>
<td>4-3</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>7</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>4-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="even">
<td>8</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>4-1</td>
<td>女</td>
<td>選修</td>
<td>4</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>9</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>4-2</td>
<td>女</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>10</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>財務金融學系</td>
<td>4</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>11</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>4-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>12</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>4-2</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>13</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>4-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>14</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>4-1</td>
<td>女</td>
<td>選修</td>
<td>3</td>
<td>待分發</td></tr>
<tr class="odd">
<td>15</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>4-1</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>16</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>4-1</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>17</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>4-2</td>
<td>女</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>18</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>大氣科學學系</td>
<td>4</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>19</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>大氣科學學系</td>
<td>4</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>20</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>地球科學學系</td>
<td>4</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>21</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>生醫科學與工程學系</td>
<td>4</td>
<td>女</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>22</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>生醫科學與工程學系</td>
<td>4</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>23</td>
<td>
	
		
		
			10*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>生醫科學與工程學系</td>
<td>4</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>24</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>英美語文學系</td>
<td>3</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="odd">
<td>25</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>法國語文學系</td>
<td>3</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>26</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>數學系(計算與資料科學組)</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>中選</td></tr>
<tr class="odd">
<td>27</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>土木工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>28</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>待分發</td></tr>
<tr class="odd">
<td>29</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>企業管理學系</td>
<td>3-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>30</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>31</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>財務金融學系</td>
<td>3</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>32</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>33</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>3-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>34</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>待分發</td></tr>
<tr class="odd">
<td>35</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>3-1</td>
<td>男</td>
<td>選修</td>
<td>12</td>
<td>待分發</td></tr>
<tr class="even">
<td>36</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>7</td>
<td>待分發</td></tr>
<tr class="odd">
<td>37</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>3-2</td>
<td>男</td>
<td>選修</td>
<td>5</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>38</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>地球科學學系</td>
<td>3</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>39</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>地球科學學系</td>
<td>3</td>
<td>男</td>
<td>選修</td>
<td>4</td>
<td>待分發</td></tr>
<tr class="even">
<td>40</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>化學學系</td>
<td>2</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="odd">
<td>41</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>中選</td></tr>
<tr class="even">
<td>42</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系光機電工程組</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>43</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系先進材料與精密製造</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>44</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系先進材料與精密製造</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>待分發</td></tr>
<tr class="odd">
<td>45</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選</td></tr>
<tr class="even">
<td>46</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系先進材料與精密製造</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>47</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系設計與分析組</td>
<td>2-3</td>
<td>男</td>
<td>選修</td>
<td>5</td>
<td>待分發</td></tr>
<tr class="even">
<td>48</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>2-1</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>49</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>2-1</td>
<td>女</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>50</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>4</td>
<td>待分發</td></tr>
<tr class="odd">
<td>51</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>2-2</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>52</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>4</td>
<td>中選</td></tr>
<tr class="odd">
<td>53</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊管理學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>54</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>財務金融學系</td>
<td>2</td>
<td>男</td>
<td>選修</td>
<td>5</td>
<td>待分發</td></tr>
<tr class="odd">
<td>55</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>56</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>57</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>電機工程學系</td>
<td>2-2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="even">
<td>58</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>2-1</td>
<td>女</td>
<td>選修</td>
<td>4</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>59</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>6</td>
<td>待分發</td></tr>
<tr class="even">
<td>60</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>61</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>62</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>2-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>63</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊電機學院學士班</td>
<td>2</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="even">
<td>64</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>大氣科學學系</td>
<td>2</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>65</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>太空科學與工程學系</td>
<td>2</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選</td></tr>
<tr class="even">
<td>66</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>太空科學與工程學系</td>
<td>2</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>中選(初選)</td></tr>
<tr class="odd">
<td>67</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>英美語文學系</td>
<td>1</td>
<td>女</td>
<td>選修</td>
<td>42</td>
<td>待分發</td></tr>
<tr class="even">
<td>68</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>化學學系</td>
<td>1</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="odd">
<td>69</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>化學學系</td>
<td>1</td>
<td>女</td>
<td>選修</td>
<td>7</td>
<td>待分發</td></tr>
<tr class="even">
<td>70</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>化學學系</td>
<td>1</td>
<td>女</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="odd">
<td>71</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系光機電工程組</td>
<td>1-1</td>
<td>男</td>
<td>選修</td>
<td>5</td>
<td>待分發</td></tr>
<tr class="even">
<td>72</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系光機電工程組</td>
<td>1-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="odd">
<td>73</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>機械工程學系光機電工程組</td>
<td>1-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="even">
<td>74</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>化學工程與材料工程學系</td>
<td>1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>中選</td></tr>
<tr class="odd">
<td>75</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>經濟學系</td>
<td>1</td>
<td>女</td>
<td>選修</td>
<td>22</td>
<td>待分發</td></tr>
<tr class="even">
<td>76</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>1-1</td>
<td>男</td>
<td>選修</td>
<td>1</td>
<td>待分發</td></tr>
<tr class="odd">
<td>77</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>1-1</td>
<td>男</td>
<td>選修</td>
<td>2</td>
<td>待分發</td></tr>
<tr class="even">
<td>78</td>
<td>
	
		
		
			11*******
		
	
	</td>
<td>
	
		
		
			ＯＯＯ
		
	
	</td>
<td>資訊工程學系</td>
<td>1-1</td>
<td>男</td>
<td>選修</td>
<td>3</td>
<td>待分發</td></tr></tbody></table>

  	</td>
  </tr>
  </tbody>
</table>
<script type="text/javascript">
<!--
	var JData = '', $ = jQuery;
	if (JData.length > 0 || JData == '{}') {
		var outline = $.parseJSON(JData);
		
		$('.courseObject').html(outline.courseObject);
		$('.courseContent').html(outline.courseContent);
		$('.books').html(outline.books);
		$('.teachType').html(outline.teachType);
		$('.courseWeight').html(outline.courseWeight);
		$('.officeHour').html(outline.officeHour);
		$('.courseArea').html(outline.courseArea);
		$('.crossCourseArea').html(outline.crossCourseArea);
		
		$('.courseMap').append(
			$.map(outline.courseMap, function(json){
				return "<tr>"
						+ "<td>"+json.core+"</td>" 
						+ "<td>"+json.strength+"</td>" 
						+ "<td>"+json.testType+"</td>" 
					+ "</tr>";
			}).join('')
		);
	}
-->
</script>
</body>
</html>`

async function getCourseDetail(courseId: string | number) {
  const res = (await axios.get(
    `https://cis.ncu.edu.tw/Course/main/support/courseDetail.html?crs=${courseId}`,
    {
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'zh-TW,zh;q=0.9',
      }
    }
  )).data;
  const data = htmlTableTo2DArray(res)
  const parsedData: Record<string,string|string[][]> = {}
  const namelist = [(data.pop() as ParsedTable).flat() as string[], (data.pop() as string[])[0]].reverse()
  const conditions = [(data.pop() as ParsedTable).flat() as string[], (data.pop() as string[])[0]].reverse()
  const competencies = [(data.pop() as ParsedTable).flat(3) as string[], (data.pop() as string[])[0]].reverse()
  for (const item of [...data, competencies, conditions, namelist]) {
    const [key, value] = item as [string, string | string[][]];
    parsedData[key] = value
  }
  return parsedData;
}

export {
  getCourseDetail,
}