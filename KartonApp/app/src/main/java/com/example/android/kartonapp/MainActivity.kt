package com.example.android.kartonapp

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.net.Uri
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import com.example.android.kartonapp.R.id.webview
import com.example.android.kartonapp.R.id.webview
import android.net.http.SslError
import android.support.annotation.Nullable
import android.webkit.*
import java.lang.Math.abs
import android.content.Intent
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import com.android.volley.*
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.StringRequest
import com.android.volley.toolbox.Volley
import org.json.JSONObject




class MainActivity : AppCompatActivity(), SensorEventListener {
    companion object {
        const val MAIN_LOG_TAG = "MainActivity"
        const val WEBCLIENT_LOG_TAG = "WebClient"
    }

    inner class ExposedData constructor(mContext: Context) {
        var context = mContext
        var x: Float = 0.0f
            @JavascriptInterface
            get

        var y: Float = 0.0f
            @JavascriptInterface
            get

        var z: Float = 0.0f
            @JavascriptInterface
            get

        @JavascriptInterface
        override fun toString(): String {
            return "X $x\tY $y\tZ $z"
        }
    }

    //    var jsimpl: Uri = Uri.parse("https://karton-zenigame.c9users.io/client/index.html")
    var jsimpl: Uri = Uri.parse("http://192.168.1.26:3000")
    var dataAggregator: ExposedData = ExposedData(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        setSupportActionBar(findViewById(R.id.toolbar_main))

        val senSensorManager: SensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val senAccelerometer: Sensor = senSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        initWebview()
        senSensorManager.registerListener(this, senAccelerometer, SensorManager.SENSOR_DELAY_UI)
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        //
        return super.onCreateOptionsMenu(menu)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun initWebview() {
        val webview = findViewById<WebView>(R.id.webview) as WebView
        //
        webview.settings.javaScriptEnabled = true
        webview.webChromeClient = WebChromeClient()
        webview.webViewClient = object : WebViewClient() {

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                Log.e(WEBCLIENT_LOG_TAG, "HTTP Receive error: ${error?.description}")
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                Log.e(WEBCLIENT_LOG_TAG, "HTTP Error: ${errorResponse?.reasonPhrase}")
            }

            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
                // this method is needed to ignore SSL certificate errors if you are visiting https website
                handler.proceed()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                Log.i(WEBCLIENT_LOG_TAG, "Deciding override for url: ${request?.url}")
                //
                if (request?.url?.host == jsimpl.host) {
                    return false
                }
                // Otherwise, the link is not for a page on my site, so launch another Activity that handles URLs
                if (request != null) {
                    val intent = Intent(Intent.ACTION_VIEW, request.url)
                    startActivity(intent)
                    return true
                }

                return false
            }
        }
        //
        webview.addJavascriptInterface(this.dataAggregator, "Sensor")
        webview.loadUrl(jsimpl.toString())
    }

    override fun onSensorChanged(event: SensorEvent) {
        // Sensor! could be null, the compiler can NOT verify this statically (Java-interop)
        val mySensor = event.sensor
        if (mySensor?.type == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]
            // Log.d(MAIN_LOG_TAG, "X $x\tY $y\tZ $z")
            //

            if(abs(x - this.dataAggregator.x) < 1 && abs(y - this.dataAggregator.y) < 1 && abs(z - this.dataAggregator.z) < 1){
                return
            }
            this.dataAggregator.x = x
            this.dataAggregator.y = y
            this.dataAggregator.z = z

            val queue = Volley.newRequestQueue(this)
            val url = "http://192.168.1.26:3000"

            val jsonBody = JSONObject()
            jsonBody.put("func", "wheel")
            jsonBody.put("x", x)
            jsonBody.put("y", y)
            jsonBody.put("z", z)

            val jsobObj = JsonObjectRequest(Request.Method.POST, url, jsonBody,
                    Response.Listener<JSONObject> { response ->
                        Log.d("Volley", "/post request OK! Response: $response")

                    },
                    Response.ErrorListener { error ->
                        VolleyLog.e("Volley", "/post request fail! Error: ${error.message}")
                    })
            queue.add(jsobObj) // Add the request to the RequestQueue.








        }
    }

    override fun onOptionsItemSelected(item: MenuItem) = when (item.itemId) {
        R.id.action_settings -> {
            // Use chose the "Settings" icon
            true
        }

        R.id.action_refresh -> {
            // Use chose the "Refresh" icon
            val webview = findViewById<WebView>(R.id.webview) as WebView
            webview.reload()
            Log.d(WEBCLIENT_LOG_TAG, "Refreshed page")
            true
        }

        else -> {
            // If we got here, an unhandled icon has been clicked.
            // Delegate to the superclass for handling.
            super.onOptionsItemSelected(item)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
        //
    }

    /**
     * TODO
     * 1) ask for calibration
     * 2) Save neutral setting/pass to external app
     * 3) decide freedom of control
     */
}




