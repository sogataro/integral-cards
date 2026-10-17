importScripts('vendor/package/all.min.js','engine.js');
self.onmessage=({data})=>{try{const result=data.action==='solve'?IntegralEngine.solve(nerdamer,data.tokens,data.mode):IntegralEngine.grade(nerdamer,data.tokens,data.mode,data.answer);self.postMessage(result);}catch{self.postMessage({status:'unknown',verdict:'unknown'});}};
