# Candle theme
A theme for the Candle Controller that offers a more 'traditional' square view.

![Candle theme screenshot](screenshot.png)

Or an even more compact version:
![Candle theme screenshot](screenshot.jpg)

It also adds some features:
- Setpoints buttons for thermostats. Allows you to quickly increase of decrease the temperature by one degree.
- Logs filtering. On the logs page, click on the filter icon in the top right to see a quick list of all your logs. You can then select the logs you want to focus on, and the rest will be hidden. You can also create presets, where you can give a name to a collection of logs, and quickly access it.
- If a thing has log data, there is now a button to jump directly to the logs page, where only the logs of that device will be shown.
- Log layering. On the logs page, press the 'overlay' button to lay all logs on top of each other. This allows you to quickly spot how certain trends relate to each other. Press the button again to go back to the normal view.
- On many pages you can use the keyboard to filter which devices are shown. Try it on the thing overview or the rules page.

There are also various small visual tweaks. For example, on the floorplan page it's easier to see when you're in editing mode. Rules boxes are a little taller so then can fit longer rule names and sentences.

In Firefox you may have to set a flag to be able to see the setpoint buttons. Visit about:config in your Firefox browser. Then, search for:

layout.css.shadow-parts.enabled

And set it to true by double clicking on it.
