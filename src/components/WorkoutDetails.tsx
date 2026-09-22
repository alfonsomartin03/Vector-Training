import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { theme } from "../constants/theme";
import { WORKOUT_LIBRARY, type BuiltWorkout } from "../lib/training/workouts";
import { targetLabel } from "../lib/training/prescription";
import { previewDuration, workoutPreview } from "../lib/training/workoutPreview";

export function WorkoutDetails({ workout, cp, p5 }: { workout: BuiltWorkout; cp: number | null; p5: number | null }) {
  const [chartWidth, setChartWidth] = useState(640);
  const preview = workoutPreview(workout, cp, p5);
  const ceiling = Math.max(1.5, ...preview.blocks.map(block => (block.fraction ?? 0) * 1.1));
  const plot = { x: 40, y: 20, width: chartWidth - 52, height: 150 };
  const y = (fraction: number) => plot.y + plot.height * (1 - fraction / ceiling);
  const template = WORKOUT_LIBRARY[workout.templateId];
  const work = workout.steps.find(step => step.role === "work");
  const warmup = workout.steps.find(step => step.role === "warmup");
  const cooldown = workout.steps.find(step => step.role === "cooldown");
  const sets = workout.parameters.sets ?? 1;
  return <View style={styles.container}>
    <Text style={styles.label}>WORKOUT PROFILE · % CP</Text>
    <View onLayout={event => setChartWidth(Math.max(180, event.nativeEvent.layout.width))} accessible accessibilityLabel={`Planned power profile for ${workout.name}, ${previewDuration(preview.durationSeconds)}. The interval outline below describes every block.`}>
      <Svg width="100%" height={210} viewBox={`0 0 ${chartWidth} 210`}>
        {[0, 0.5, 1].map(fraction => <Line key={fraction} x1={plot.x} x2={plot.x + plot.width} y1={y(fraction)} y2={y(fraction)} stroke="#DEE3DF" />)}
        {[0, 0.5, 1].map(fraction => <SvgText key={fraction} x={plot.x - 7} y={y(fraction) + 4} fontSize={11} fill="#68746C" textAnchor="end">{Math.round(fraction * 100)}%</SvgText>)}
        {preview.blocks.map((block, index) => <Rect key={index}
          x={plot.x + block.startSeconds / preview.durationSeconds * plot.width}
          y={y(block.fraction ?? 0)}
          width={block.durationSeconds / preview.durationSeconds * plot.width}
          height={Math.max(1, (block.fraction ?? 0) / ceiling * plot.height)}
          fill={block.fraction !== null && block.fraction > 1 ? "#E7708D" : block.fraction !== null && block.fraction > 0.75 ? "#E5B65E" : "#83BD83"}
          stroke="#FFFFFF" strokeWidth={0.5}
        />)}
        <Line x1={plot.x} x2={plot.x + plot.width} y1={y(1)} y2={y(1)} stroke="#414C45" strokeDasharray="4 4" />
        <SvgText x={plot.x + plot.width} y={y(1) - 5} fontSize={11} fill="#414C45" textAnchor="end">CP</SvgText>
        {[0, 0.25, 0.5, 0.75, 1].map(fraction => <SvgText key={fraction} x={plot.x + fraction * plot.width} y={195} fontSize={11} fill="#68746C" textAnchor={fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"}>{previewDuration(Math.round(preview.durationSeconds * fraction))}</SvgText>)}
      </Svg>
    </View>
    <Text style={styles.note}>Green: easy/endurance · Amber: sustained · Pink: above CP. Width shows time; height shows planned power, not a recorded ride.</Text>
    <View style={styles.columns}>
      <View style={styles.outline}>
        <Text style={styles.heading}>Interval outline</Text>
        {warmup ? <Block title="Warm-up" detail={`${previewDuration(warmup.durationSeconds)} · ${targetLabel(warmup.target, cp, p5)}`} /> : null}
        {work ? <Block title={template.structure === "continuous" ? "Endurance" : `${sets > 1 ? `${sets} sets · ` : ""}${workout.parameters.repetitionsPerSet} repeats`} detail={`${previewDuration(work.durationSeconds)} · ${targetLabel(work.target, cp, p5)}`} /> : null}
        {template.structure === "intervals" && ((workout.parameters.repetitionsPerSet ?? 1) > 1 || template.recoveryAfterLastRepetition) ? <Text style={styles.copy}>↳ {previewDuration(template.recovery.durationSeconds)} {targetLabel(template.recovery.target, cp, p5)} {template.recoveryAfterLastRepetition ? "after each repeat, including the last" : "between repeats only"}</Text> : null}
        {template.structure === "intervals" && sets > 1 ? <Text style={styles.copy}>↳ {previewDuration(template.betweenSets.durationSeconds)} {targetLabel(template.betweenSets.target, cp, p5)} between sets</Text> : null}
        {cooldown ? <Block title="Cooldown" detail={`${previewDuration(cooldown.durationSeconds)} · ${targetLabel(cooldown.target, cp, p5)}`} /> : null}
      </View>
      <View style={styles.stats}>
        <Text style={styles.heading}>Planned session</Text>
        <Stat label="Duration" value={previewDuration(preview.durationSeconds)} />
        <Stat label="Work intervals / riding" value={previewDuration(preview.workMinutes * 60)} />
        <Stat label="Average power (est.)" value={preview.averageWatts === null ? "—" : `${Math.round(preview.averageWatts)} W`} />
        <Stat label="Average intensity (est.)" value={preview.averageWatts !== null && cp ? `${Math.round(preview.averageWatts / cp * 100)}% CP` : "—"} />
        <Stat label="Mechanical work (est.)" value={preview.workKj === null ? "—" : `${Math.round(preview.workKj)} kJ`} />
        <Stat label="Work above CP (est.)" value={preview.aboveCpKj === null ? "—" : `${Math.round(preview.aboveCpKj)} kJ`} />
      </View>
    </View>
    <Text style={styles.note}>Estimates use Z2 at 65.5% CP, upper Z2 at 75%, and Z1–Z2 at 55%. Actual power will vary. Average intensity is not normalized intensity or training load. Watts require current power-test data.</Text>
  </View>;
}

function Block({ title, detail }: { title: string; detail: string }) { return <View style={styles.block}><Text style={styles.blockTitle}>{title}</Text><Text style={styles.copy}>{detail}</Text></View>; }
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.copy}>{label}</Text><Text style={styles.blockTitle}>{value}</Text></View>; }
const styles = StyleSheet.create({
  container: { marginTop: 24, gap: 14 },
  label: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 28 },
  outline: { flexGrow: 1, flexBasis: 240, gap: 10 },
  stats: { flexGrow: 1, flexBasis: 240, gap: 12 },
  heading: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  block: { gap: 4, marginTop: 6 },
  blockTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  copy: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  note: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  stat: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
});
