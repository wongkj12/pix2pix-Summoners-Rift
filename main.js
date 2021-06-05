 var model = undefined;

 var const canvas = document.getElementById("canvas");
 canvas.width = 256;
 canvas.height = 256;

 var oCanvas = document.getElementById("oCanvas");
 oCanvas.width = 256;
 oCanvas.height = 256;


 let context = canvas.getContext("2d")
 let start_background_color = "white"
 context.fillStyle = start_background_color;
 context.fillRect(0, 0, canvas.width, canvas.height);

 let draw_color = "#fb8a05"; //lane
 let draw_width = "55";
 let is_drawing = false;

//color pallette click event
 function change_color(element){
 	draw_color = element.style.background;
 }


 canvas.addEventListener("touchstart", startcanvas, false);
 canvas.addEventListener("touchmove", draw, false);
 canvas.addEventListener("mousedown", startcanvas, false);
 canvas.addEventListener("mousemove", draw, false);

 canvas.addEventListener("touchend",stop,false);

 //start predicting when the mouse is up
 canvas.addEventListener("mouseup",() => {
 	stop();
 	do_predict();},false);
 canvas.addEventListener("mouseout",stop,false);



 function startcanvas(event) {
 	is_drawing = true;
 	context.beginPath();
 	context.moveTo(getX(event), getY(event));
 	event.preventDefault();
 }

//start prediction from drawing canvas => tf.predict => output canvas
 function do_predict(event) {
 	const imgData = getImageData();
 	const pred = predict(imgData);
 	tf.toPixels(pred, oCanvas);
 }

 //get current image data
 function getImageData() {
 	//const dpi = window.devicePixelRatio
 	const dpi = 1;
 	const x = 0 * dpi;
 	const y = 0 * dpi;
 	const w = canvas.width * dpi;
 	const h = canvas.height * dpi;
 	const imgData = context.getImageData(0, 0, w, h)
 	return imgData;
 }

 //get prediction from tf
function predict(imgData) {
	return tf.tidy(() => {
		const oImg = model.predict(preprocess(imgData));
		//post process
		const postImg = postprocess(oImg);
		return postImg;
	})
}

//preprocessing
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        const tensor = tf.fromPixels(imgData).toFloat()
        //resize 
        const resized = tf.image.resizeBilinear(tensor, [256, 256])
                
        //normalize 
        const offset = tf.scalar(127.5);
        const normalized = resized.div(offset).sub(tf.scalar(1.0));

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        
        return batched
    })
}

//post process
function postprocess(tensor){
     const w = canvas.width  
     const h = canvas.height 
     
     return tf.tidy(() => {
        //normalization factor  
        const scale = tf.scalar(0.5);
        
        //unnormalize and sqeeze 
        const squeezed = tensor.squeeze().mul(scale).add(scale)

        //resize to canvas size 
        const resized = tf.image.resizeBilinear(squeezed, [w, h])
        return resized
    })
}

//initial sample prediction
function samplePredict(imgName)
{
	var imgData = new Image;
	imgData.src = imgName
	imgData.onload = function () {
		const img = new fabric.Image(imgData, {
			scaleX: canvas.width / 256,
			scaleY: canvas.height / 256,
		});
		canvas.add(img);
		const pred = predict(imgData);
		tf.toPixels(pred, oCanvas);
	}
}

//load model
async function start(imgName, modelPath) {
	//load the model
	model = await tf.loadLayersModel(modelPath);

	//status
	document.getElementById('status').innerHTML = "Model Loaded";

	//sample
	samplePredict(imgName);


}



 function draw(event) {
 	if (is_drawing) {
 		context.lineTo(getX(event), getY(event));
 		context.strokeStyle = draw_color;
 		context.lineWidth = draw_width;
 		context.lineCap = "round";
 		context.lineJoin = "round";
 		context.stroke();
 	}
 	event.preventDefault();
 }

 function getX(event) {
 	if (event.pageX == undefined) {return event.targetTouches[0].pageX -
 	canvas.offsetLeft} //i.e. if no click event is registered, check for touch event
 	else {return event.pageX - canvas.offsetLeft}
 }

 function getY(event) {
 	if (event.pageY == undefined) {return event.targetTouches[0].pageY -
 	canvas.offsetTop} //i.e. if no click event is registered, check for touch event
 	else {return event.pageY - canvas.offsetTop}
 }
 
 function stop(event) {
 	if (is_drawing){
 		context.stroke();
 		context.closePath();
 		is_drawing = false;
 	}
 	event.preventDefault();
 }

function clear_canvas(){
		context.fillStyle = start_background_color;
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillRect(0, 0, canvas.width, canvas.height);
}

