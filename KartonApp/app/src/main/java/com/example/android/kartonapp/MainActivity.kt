package com.example.android.kartonapp

import android.annotation.SuppressLint
import android.app.SearchManager
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
import android.support.v7.widget.SearchView
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast


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

    private var jsimpl: Uri? = null
    private var dataAggregator: ExposedData = ExposedData(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        setSupportActionBar(findViewById(R.id.toolbar_main))

        // "http://10.5.23.251:3000/index.html"
        handleNewTarget("http://192.168.43.167:3000/index.html")
    }

    // TODO, Make this work with search window
    private fun handleNewTarget(url: String?): Boolean {
        Log.d(MAIN_LOG_TAG, "Received $url")

        val target = Uri.parse(url)
        if (target.isAbsolute && (target.scheme == "http" || target.scheme == "https")) {
            Log.d(MAIN_LOG_TAG, "Setting url target")
            this.jsimpl = target
        }


        if (this.jsimpl != null) {
            val senSensorManager: SensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
            val senAccelerometer: Sensor = senSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

            initWebview(this.jsimpl)
            senSensorManager.registerListener(this, senAccelerometer, SensorManager.SENSOR_DELAY_UI)
            return true
        } else {
            Toast.makeText(this, "No valid URL provided", Toast.LENGTH_SHORT).show()
            return false
        }
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        // Configure search widget
//        val searchItem = menu?.findItem(R.id.action_search)
//        var searchView = searchItem?.actionView as SearchView
        //
        return super.onCreateOptionsMenu(menu)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun initWebview(targetUri: Uri?) {
        if (targetUri == null) return;

        Log.w(MAIN_LOG_TAG, "Initialising webview")
        val webview = findViewById<WebView>(R.id.webview) as WebView
        //
        webview.settings.javaScriptEnabled = true
        webview.webChromeClient = WebChromeClient()
        val customWebClient = object : WebViewClient() {

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
                //
                if (request?.url?.host == targetUri.host) {
                    return false
                }
                // Otherwise, the link is not for a page on my site, so launch another Activity that handles URLs
                if (request != null) {
                    Log.w(WEBCLIENT_LOG_TAG, "Overriding for url: ${request.url}")
                    val intent = Intent(Intent.ACTION_VIEW, request.url)
                    startActivity(intent)
                    return true
                }

                return false
            }
        }
        webview.webViewClient = customWebClient
        //
        webview.addJavascriptInterface(this.dataAggregator, "Sensor")
        webview.loadUrl(targetUri.toString())
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
            this.dataAggregator.x = x
            this.dataAggregator.y = y
            this.dataAggregator.z = z
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

//        R.id.action_search -> {
//            Log.d(MAIN_LOG_TAG, "OnItemSelected")
//            val searchView = item.actionView as SearchView
//            if (handleNewTarget(searchView.query.toString())) {
//                Toast.makeText(this, "Processing URL", Toast.LENGTH_SHORT).show()
//            } else {
//                Toast.makeText(this, "Invalid URL", Toast.LENGTH_SHORT).show()
//            }
//            true
//        }

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




