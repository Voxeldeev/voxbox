// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import {InstrumentType, Config} from "../synth/SynthConfig";
import {Instrument} from "../synth/synth";
import {SongDocument} from "./SongDocument";
import {ChangeSetEnvelopeTarget, ChangeSetEnvelopeType, ChangeRemoveEnvelope, ChangeEnvelopeInverse, ChangeEnvelopePitchStart, ChangeEnvelopePitchEnd} from "./changes";
import {HTML} from "imperative-html/dist/esm/elements-strict";
import {DropdownID} from "../synth/SynthConfig";

export class EnvelopeEditor {
	public readonly container: HTMLElement = HTML.div({class: "envelopeEditor"});
	
	
	private readonly _rows: HTMLDivElement[] = [];
	private readonly _targetSelects: HTMLSelectElement[] = [];
	private readonly _envelopeSelects: HTMLSelectElement[] = [];
	private readonly _deleteButtons: HTMLButtonElement[] = [];
	public readonly _extraSettingsDropdowns: HTMLButtonElement[] = [];
	public readonly _inverters: HTMLInputElement[] = [];
	public readonly _dropdownGroups: HTMLDivElement[] = [];

	private readonly _pitchStartSliders: HTMLInputElement[] = [];
	private readonly _pitchEndSliders: HTMLInputElement[] = [];
	private readonly _startNoteDisplays: HTMLSpanElement[] = [];
	private readonly _endNoteDisplays: HTMLSpanElement[] = [];

	public readonly extraPitchSettingsGroups: HTMLDivElement[] = [];
	public readonly pitchStartBoxes: HTMLInputElement[] = [];
	public readonly pitchEndBoxes: HTMLInputElement[] = [];

	public readonly _openExtraSettingsDropdowns: Boolean[] = [];
	private _renderedEnvelopeCount: number = 0;
	private _renderedEqFilterCount: number = -1;
	private _renderedNoteFilterCount: number = -1;
	private _renderedInstrumentType: InstrumentType;
	private _renderedEffects: number = 0;
	
	private _onInput = (event: Event): void => {
        const startBoxIndex: number = this.pitchStartBoxes.indexOf(<any>event.target);
        const endBoxIndex: number = this.pitchEndBoxes.indexOf(<any>event.target);
        const startSliderIndex: number = this._pitchStartSliders.indexOf(<any>event.target);
        const endSliderIndex: number = this._pitchEndSliders.indexOf(<any>event.target);
        if (startBoxIndex != -1) {
            this._doc.record(new ChangeEnvelopePitchStart(this._doc, parseInt(this.pitchStartBoxes[startBoxIndex].value), startBoxIndex));
        } else if (endBoxIndex != -1) {
            this._doc.record(new ChangeEnvelopePitchEnd(this._doc, parseInt(this.pitchEndBoxes[endBoxIndex].value), endBoxIndex));
        } else if (startSliderIndex != -1) {
            this._doc.record(new ChangeEnvelopePitchStart(this._doc, parseInt(this._pitchStartSliders[startSliderIndex].value), startSliderIndex));
        } else if (endSliderIndex != -1) {
            this._doc.record(new ChangeEnvelopePitchEnd(this._doc, parseInt(this._pitchEndSliders[endSliderIndex].value), endSliderIndex));
        }
    }

	constructor(private _doc: SongDocument, private _extraSettingsDropdown: Function, private _openPrompt: Function) {
		this.container.addEventListener("change", this._onChange);
		this.container.addEventListener("click", this._onClick);
		this.container.addEventListener("input", this._onInput);
	}
	
	private _onChange = (event: Event): void => {
		const targetSelectIndex: number = this._targetSelects.indexOf(<any> event.target);
		const envelopeSelectIndex: number = this._envelopeSelects.indexOf(<any> event.target);
		const inverseIndex = this._inverters.indexOf(<any>event.target);
		if (targetSelectIndex != -1) {
			const combinedValue: number = parseInt(this._targetSelects[targetSelectIndex].value);
			const target: number = combinedValue % Config.instrumentAutomationTargets.length;
			const index: number = (combinedValue / Config.instrumentAutomationTargets.length) >>> 0;
			this._doc.record(new ChangeSetEnvelopeTarget(this._doc, targetSelectIndex, target, index));
		} else if (envelopeSelectIndex != -1) {
			this._doc.record(new ChangeSetEnvelopeType(this._doc, envelopeSelectIndex, this._envelopeSelects[envelopeSelectIndex].selectedIndex));
		} else if ((inverseIndex != -1)) {
			this._doc.record(new ChangeEnvelopeInverse(this._doc, this._inverters[inverseIndex].checked, inverseIndex));
		}

	}
	
	private _onClick = (event: MouseEvent): void => {
		const index: number = this._deleteButtons.indexOf(<any> event.target);
		if (index != -1) {
			this._doc.record(new ChangeRemoveEnvelope(this._doc, index));
		}
	}
	
	private _makeOption(target: number, index: number): HTMLOptionElement {
		let displayName = Config.instrumentAutomationTargets[target].displayName;
		if (Config.instrumentAutomationTargets[target].maxCount > 1) {
			if (displayName.indexOf("#") != -1) {
				displayName = displayName.replace("#", String(index+1));
			} else {
				displayName += " " + (index+1);
			}
		}
		return HTML.option({value: target + index * Config.instrumentAutomationTargets.length}, displayName);
	}
	
	private _updateTargetOptionVisibility(menu: HTMLSelectElement, instrument: Instrument): void {
		for (let optionIndex: number = 0; optionIndex < menu.childElementCount; optionIndex++) {
			const option: HTMLOptionElement = <HTMLOptionElement> menu.children[optionIndex];
			const combinedValue: number = parseInt(option.value);
			const target: number = combinedValue % Config.instrumentAutomationTargets.length;
			const index: number = (combinedValue / Config.instrumentAutomationTargets.length) >>> 0;
			option.hidden = !instrument.supportsEnvelopeTarget(target, index);
		}
	}

public rerenderExtraSettings() {
        const instrument: Instrument = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument()];
        for (let i = 0; i < Config.maxEnvelopeCount; i++) {
			if (i >= instrument.envelopeCount) {
                if (this._extraSettingsDropdowns[i]) { //make sure is not null so that we don't get an error
                    this._extraSettingsDropdowns[i].style.display = "none";
                }
                if (this.extraPitchSettingsGroups[i]) {
                    this.extraPitchSettingsGroups[i].style.display = "none";
                }
			}
            if (i >= instrument.envelopeCount) {
                if (this._extraSettingsDropdowns[i]) { //make sure is not null so that we don't get an error
                    this._extraSettingsDropdowns[i].style.display = "none";
                }
                if (this._dropdownGroups[i]) {
                    this._dropdownGroups[i].style.display = "none";
                }
            } else if (this._extraSettingsDropdowns[i].textContent == "▲") {
                this._dropdownGroups[i].style.display = "flex";
                this._extraSettingsDropdowns[i].style.display = "inline";
				
				if (Config.envelopes[instrument.envelopes[i].envelope].name == "pitch") {
                    this.extraPitchSettingsGroups[i].style.display = "flex";
                    this.pitchStartBoxes[i].value = instrument.envelopes[i].pitchEnvelopeStart.toString();
					this.pitchEndBoxes[i].value = instrument.envelopes[i].pitchEnvelopeEnd.toString();
					//update note displays
					this._startNoteDisplays[i].textContent = "Start " + this._pitchToNote(parseInt(this.pitchStartBoxes[i].value), /*instrument.isNoiseInstrument*/) + ": ";
					this._endNoteDisplays[i].textContent = "End " + this._pitchToNote(parseInt(this.pitchEndBoxes[i].value),  /*instrument.isNoiseInstrument*/) + ": ";
    			} else { this.extraPitchSettingsGroups[i].style.display = "none"; }

				this._inverters[i].checked = instrument.envelopeInverse[i];
            } else if (this._extraSettingsDropdowns[i].textContent == "▼") {
                this._dropdownGroups[i].style.display = "none";
                this._extraSettingsDropdowns[i].style.display = "inline";
				this.extraPitchSettingsGroups[i].style.display = "none";
            } else {
                this._extraSettingsDropdowns[i].style.display = "none";
                this._dropdownGroups[i].style.display = "none";
				this.extraPitchSettingsGroups[i].style.display = "none";
            }
        }
    }
	
	private _pitchToNote(value: number, /*isNoise: boolean*/): string {
        let text = "";
		/*
        if (isNoise) {
            value = value * 6 + 12;
        }
		*/
        const offset: number = Config.keys[this._doc.song.key].basePitch % Config.pitchesPerOctave;
        const keyValue = (value + offset) % Config.pitchesPerOctave;
        if (Config.keys[keyValue].isWhiteKey) {
            text = Config.keys[keyValue].name;
        } else {
            const shiftDir: number = Config.blackKeyNameParents[value % Config.pitchesPerOctave];
            text = Config.keys[(keyValue + Config.pitchesPerOctave + shiftDir) % Config.pitchesPerOctave].name;
            if (shiftDir == 1) {
                text += "♭";
            } else if (shiftDir == -1) {
                text += "♯";
            }
        }
        return "[" + text + Math.floor((value + Config.pitchesPerOctave) / 12 + this._doc.song.octave - 1) + "]";
    }

	public render(): void {
		const instrument: Instrument = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument()];
		
		for (let envelopeIndex: number = this._rows.length; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
			const targetSelect: HTMLSelectElement = HTML.select();
			for (let target: number = 0; target < Config.instrumentAutomationTargets.length; target++) {
				const interleaved: boolean = (Config.instrumentAutomationTargets[target].interleave);
				for (let index: number = 0; index < Config.instrumentAutomationTargets[target].maxCount; index++) {
					targetSelect.appendChild(this._makeOption(target, index));
					if (interleaved) {
						targetSelect.appendChild(this._makeOption(target + 1, index));
					}
				}
				if (interleaved) target++;
			}
			
			const envelopeSelect: HTMLSelectElement = HTML.select();
			for (let envelope: number = 0; envelope < Config.envelopes.length; envelope++) {
				envelopeSelect.appendChild(HTML.option({value: envelope}, Config.envelopes[envelope].name));
			} 


			const startNoteSlider: HTMLInputElement = HTML.input({ value: instrument.envelopes[envelopeIndex].pitchEnvelopeStart, style: "width: 113px; margin-left: 0px;", type: "range", min: "0", max: 96, step: "1" });
            const startNoteBox: HTMLInputElement = HTML.input({ value: instrument.envelopes[envelopeIndex].pitchEnvelopeStart, style: "width: 4em; font-size: 80%; ", id: "startNoteBox", type: "number", step: "1", min: "0", max: 96 });
            const endNoteSlider: HTMLInputElement = HTML.input({ value: instrument.envelopes[envelopeIndex].pitchEnvelopeEnd, style: "width: 113px; margin-left: 0px;", type: "range", min: "0", max: 96, step: "1" });
            const endNoteBox: HTMLInputElement = HTML.input({ value: instrument.envelopes[envelopeIndex].pitchEnvelopeEnd, style: "width: 4em; font-size: 80%; ", id: "endNoteBox", type: "number", step: "1", min: "0", max: 96 });
			
			const startNoteDisplay: HTMLSpanElement = HTML.span({ class: "tip", style: `width:68px; flex:1; height:1em; font-size: smaller;`, onclick: () => this._openPrompt("pitchRange") }, "Start " + this._pitchToNote(parseInt(startNoteBox.value),/* instrument.isNoiseInstrument */) + ": ");
            const endNoteDisplay: HTMLSpanElement = HTML.span({ class: "tip", style: `width:68px; flex:1; height:1em; font-size: smaller;`, onclick: () => this._openPrompt("pitchRange") }, "End " + this._pitchToNote(parseInt(endNoteBox.value), /*instrument.isNoiseInstrument */) + ": ");
            const startBoxWrapper: HTMLDivElement = HTML.div({ style: "flex: 1; display: flex; flex-direction: column; align-items: center;" }, startNoteDisplay, startNoteBox);
            const endBoxWrapper: HTMLDivElement = HTML.div({ style: "flex: 1; display: flex; flex-direction: column; align-items: center;" }, endNoteDisplay, endNoteBox);

			const startNoteWrapper: HTMLDivElement = HTML.div({ style: "margin-top: 3px; flex:1; display:flex; flex-direction: row; align-items:center; justify-content:right;" }, startBoxWrapper, startNoteSlider);
            const endNoteWrapper: HTMLDivElement = HTML.div({ style: "margin-top: 3px; flex:1; display:flex; flex-direction: row; align-items:center; justify-content:right;" }, endBoxWrapper, endNoteSlider);

			const extraPitchSettingsGroup: HTMLDivElement = HTML.div({ class: "editor-controls", style: "flex-direction:column; align-items:center;" }, startNoteWrapper, endNoteWrapper);
            extraPitchSettingsGroup.style.display = "none";

			const invertBox: HTMLInputElement = HTML.input({ "checked": instrument.envelopeInverse[envelopeIndex], type: "checkbox", style: "width: 1em; padding: 0.5em; margin-left: 4em;", id: "invertBox" });
			const invertWrapper: HTMLDivElement = HTML.div({ style: "margin: 0.5em; align-items:center; justify-content:right;" }, HTML.span({ class: "tip", onclick: () => this._openPrompt("envelopeInvert") }, "Invert: "), invertBox);
			const extraSettingsDropdown: HTMLButtonElement = HTML.button({ style: "margin-left:0em; margin-right: 0.3em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;", onclick: () => { const instrument: Instrument = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument()]; this._extraSettingsDropdown(DropdownID.EnvelopeSettings, envelopeIndex, Config.envelopes[instrument.envelopes[envelopeIndex].envelope].name); } }, "▼");
			const extraSettingsDropdownGroup: HTMLDivElement = HTML.div({ class: "editor-controls", style: "flex-direction:column; align-items:center;" }, extraPitchSettingsGroup, invertWrapper);
            extraSettingsDropdownGroup.style.display = "none";

			


			const deleteButton: HTMLButtonElement = HTML.button({type: "button", class: "delete-envelope"});
			
			const row: HTMLDivElement = HTML.div({class: "envelope-row"},
			extraSettingsDropdown,
				HTML.div({class: "selectContainer", style: "width: 0; flex: 1;"}, targetSelect),
				HTML.div({class: "selectContainer", style: "width: 0; flex: 0.7;"}, envelopeSelect),
				deleteButton,
			);
			
			this.container.appendChild(row);
			this.container.appendChild(extraSettingsDropdownGroup);
			this._rows[envelopeIndex] = row;
			this._inverters[envelopeIndex] = invertBox;
			this._dropdownGroups[envelopeIndex] = extraSettingsDropdownGroup;
			this._extraSettingsDropdowns[envelopeIndex] = extraSettingsDropdown;
			this._targetSelects[envelopeIndex] = targetSelect;
			this._envelopeSelects[envelopeIndex] = envelopeSelect;
			this._deleteButtons[envelopeIndex] = deleteButton;
			this.extraPitchSettingsGroups[envelopeIndex] = extraPitchSettingsGroup;
            this._pitchStartSliders[envelopeIndex] = startNoteSlider;
            this.pitchStartBoxes[envelopeIndex] = startNoteBox;
            this._pitchEndSliders[envelopeIndex] = endNoteSlider;
            this.pitchEndBoxes[envelopeIndex] = endNoteBox;
            this._startNoteDisplays[envelopeIndex] = startNoteDisplay;
            this._endNoteDisplays[envelopeIndex] = endNoteDisplay;
		}
		
		for (let envelopeIndex: number = this._renderedEnvelopeCount; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
			this._rows[envelopeIndex].style.display = "";
			// For newly visible rows, update target option visibiliy.
			this._updateTargetOptionVisibility(this._targetSelects[envelopeIndex], instrument);
		}
		
		for (let envelopeIndex: number = instrument.envelopeCount; envelopeIndex < this._renderedEnvelopeCount; envelopeIndex++) {
			this._rows[envelopeIndex].style.display = "none";
		}

		let useControlPointCount: number = instrument.noteFilter.controlPointCount;
		if (instrument.noteFilterType)
			useControlPointCount = 1;
		
		if (this._renderedEqFilterCount != instrument.eqFilter.controlPointCount ||
			this._renderedNoteFilterCount != useControlPointCount ||
			this._renderedInstrumentType != instrument.type ||
			this._renderedEffects != instrument.effects)
		{
			// Update target option visibility for previously visible rows.
			for (let envelopeIndex: number = 0; envelopeIndex < this._renderedEnvelopeCount; envelopeIndex++) {
				this._updateTargetOptionVisibility(this._targetSelects[envelopeIndex], instrument);
			}
		}
		
		for (let envelopeIndex: number = 0; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
			this._targetSelects[envelopeIndex].value = String(instrument.envelopes[envelopeIndex].target + instrument.envelopes[envelopeIndex].index * Config.instrumentAutomationTargets.length);
			this._envelopeSelects[envelopeIndex].selectedIndex = instrument.envelopes[envelopeIndex].envelope;
			this._inverters[envelopeIndex].checked = instrument.envelopeInverse[envelopeIndex];
		}
		
		this._renderedEnvelopeCount = instrument.envelopeCount;
		this._renderedEqFilterCount = instrument.eqFilter.controlPointCount;
		this._renderedNoteFilterCount = useControlPointCount;
		this._renderedInstrumentType = instrument.type;
		this._renderedEffects = instrument.effects;
		this.rerenderExtraSettings()
	}
}
