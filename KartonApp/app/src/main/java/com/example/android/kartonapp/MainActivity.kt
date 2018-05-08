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



class MainActivity : AppCompatActivity(), SensorEventListener {


    override fun onCreate(savedInstanceState: Bundle?) {
        var senSensorManager: SensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        var senAccelerometer: Sensor =  senSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)


        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        senSensorManager.registerListener(this, senAccelerometer , SensorManager.SENSOR_DELAY_NORMAL)
    }

    public override fun onSensorChanged(event: SensorEvent) {
       val mySensor = event.sensor

        if (mySensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]
            Log.d("X Y Z ", "" + x.toString() + " " + y.toString() + " " + z.toString())

            var textViewToChange: TextView = findViewById<TextView>(R.id.debug_view) as TextView
            textViewToChange.text = "" + x.toString() + " " + y.toString() + " " + z.toString()

        }
    }

    public override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {

    }
}




