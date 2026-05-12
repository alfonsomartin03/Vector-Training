# Training-app

Tailor made training with a simple block periodization outline.

## Starting User Input (Updated after each cycle)
- Training Backgroup
- Goal
- Plan Duration (20w max)
- Access to PM HR?
- Rest Days/week
- Known FTP & VO2 power?
- Recovery metrics

Platform then takes this information and creates a tailored training plan to fit the needs of the user. 
Consists of 3 weeks on one week off per cycle. Cycles are: Base, build, Peak, structure. If user wishes to maintain fitness app creates a plan with shorter more even cycles.

# User Interface
## Profile
Contains all the users data. This includes training hours, FTP, VO2, height, weight, gender.
## Calendar
Shows the planned sessions per week as well as a summary of the work per week. User can scroll through and tap to open specific workouts. 
## Power Chart
Shows 84D max power for 5s 10s 30s 1m 5m 10m 20m 30m 45m 1h 2h 4h and compares to the age gender and weight of other cyclist. 
Two lines for the power chart, fresh and fatigued. The equation for the fatigued chart is kJ=2h@FTP
## Nutrition guide
Simple outline of what to eat how to eat and how to fuel rides depending on intensity and duration as well as lead up to races. 

# Backend
## Workout sharing
Connect to Garmin, Wahoo, Hammerhead, etc.
Pull and push workout and training data

## Plan creation 
Input user numbers to a custon AI bot that then creates the plan.
Take the workouts and place them into the calendar.
Find a way so that the user is able to modify the plan slightly if something comes up.
