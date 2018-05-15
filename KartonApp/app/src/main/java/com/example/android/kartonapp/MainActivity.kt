package com.example.android.kartonapp

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import android.webkit.WebView
import com.example.android.kartonapp.R.id.webview
import android.webkit.JavascriptInterface
import com.example.android.kartonapp.R.id.webview
import android.webkit.WebViewClient
import com.example.android.kartonapp.MainActivity.JsObject
import android.net.http.SslError
import android.webkit.SslErrorHandler
import java.lang.Math.abs


class MainActivity : AppCompatActivity(), SensorEventListener {

    var str : String = ""
    var  webview : WebView = findViewById<WebView>(R.id.webview) as WebView
    var oldX = 0.0F
    var oldY = 0.0F
    var oldZ = 0.0F

    class coords {
        var x = 0.0f
        var y = 0.0f
        var z = 0.0f
        @JavascriptInterface
        public fun getValues() : String { return "" + x + " " + y + " " + z}
    }

    internal inner class JsObject {
        @JavascriptInterface
        override fun toString(): String {
            return "injectedObject"
        }
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        var senSensorManager: SensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        var senAccelerometer: Sensor =  senSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)


        initWebview()

        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        senSensorManager.registerListener(this, senAccelerometer , SensorManager.SENSOR_DELAY_UI)




    }

    private fun initWebview(){

        webview.getSettings().setJavaScriptEnabled(true);

        webview.setWebViewClient(WebViewClient() )

           /*override fun onReceivedError(view: WebView, errorCode: Int, description: String, failingUrl: String) {
                Log.e("browser", description)
            }

            override fun onPageFinished(view: WebView, url: String) {
                // do your javascript injection here, remember "javascript:" is needed to recognize this code is javascript
                webview.loadUrl("javascript:alert('hello')")
            }

            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
                // this method is needed to ignore SSL certificate errors if you are visiting https website
                handler.proceed()
            }

        })*/

        webview.loadUrl("https://karton-zenigame.c9users.io/client/index.html")
    }

    public override fun onSensorChanged(event: SensorEvent) {

       val mySensor = event.sensor

        if (mySensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]
            Log.d("X Y Z ", "" + x.toString() + " " + y.toString() + " " + z.toString())

            if(abs(oldX - x) < 1 || abs(oldY - y) < 1 || abs(oldZ - z ) < 1){
                return;
            }
            else{
                oldX = x
                oldY = y
                oldZ = z
            }

           // var textViewToChange: TextView = findViewById<TextView>(R.id.debug_view) as TextView
            //textViewToChange.text = "" + x.toString() + " " + y.toString() + " " + z.toString()
            webview.loadUrl("javascript:document.getElementById('hier').innerHTML='$x$y$z'")





           /* webview.settings.javaScriptEnabled = true
            var c = coords()
            c.x = x
            c.y = y
            c.z = z

            //webview.setWebViewClient(WebViewClient())
            webview.addJavascriptInterface(JsObject(), "injectedObject")
            webview.loadData("", "text/html", null)
            webview.loadUrl("javascript:alert(injectedObject.toString())")*/

        }
    }

    public override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {

    }

    /**
     * TODO
     * 1) ask for calibration
     * 2) Save neutral setting/pass to external app
     * 3) decide freedom of control 
     */
}




