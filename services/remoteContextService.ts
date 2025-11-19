
export interface RemotePdf {
    name: string;
    grade: string;
    unit: string;
    url: string;
}

// Base URL for the GitHub Releases where PDFs are hosted
const BASE_URL = 'https://github.com/abdulahadattar/STBB-BOOKS/releases/download/STBB/';

const fileNames = [
    // Grade 9
    "Physics.Grade.9.Unit.01.Physical.Quantity.and.Measurement_.pdf",
    "Physics.Grade.9.Unit.02.Kinematic_.pdf",
    "Physics.Grade.9.Unit.03.Dynamic_.pdf",
    "Physics.Grade.9.Unit.04.Turning.Effect.of.Forces_.pdf",
    "Physics.Grade.9.Unit.05.Forces.and.Matter_.pdf",
    "Physics.Grade.9.Unit.06.Gravitation_.pdf",
    "Physics.Grade.9.Unit.07.Energy.Source.and.Transfer.of.Energy_.pdf",
    "Physics.Grade.9.Unit.08.Properties.of.Matter_.pdf",
    "Physics.Grade.9.Unit.09.Thermal.Properties.of.Matter_.pdf",
    // Grade 10
    "Physics.Grade.10.Unit.10.General.Waves.Properties_.pdf",
    "Physics.Grade.10.Unit.11.Sound_.pdf",
    "Physics.Grade.10.Unit.12.Electromagnetic.Spectrum_.pdf",
    "Physics.Grade.10.Unit.13.Geometrical.Optics_.pdf",
    "Physics.Grade.10.Unit.14.Electrostatics_.pdf",
    "Physics.Grade.10.Unit.15.Current.Electricity_.pdf",
    "Physics.Grade.10.Unit.16.Electromagnetism_.pdf",
    "Physics.Grade.10.Unit.17.Introductory.Electronics_.pdf",
    "Physics.Grade.10.Unit.18.Information.and.Communication.Technology.ICT_.pdf",
    "Physics.Grade.10.Unit.19.Atomic.Structure_.pdf",
    "Physics.Grade.10.Unit.20.Nuclear.Structure_.pdf",
    // Grade 11
    "Physics.Grade.11.Unit.01.Measurements_.pdf",
    "Physics.Grade.11.Unit.02.Kinematics_.pdf",
    "Physics.Grade.11.Unit.03.Dynamics_.pdf",
    "Physics.Grade.11.Unit.04.Rotational.and.Circular.Motion_.pdf",
    "Physics.Grade.11.Unit.05.Work.Energy.and.Power_.pdf",
    "Physics.Grade.11.Unit.06.Fluid.Statics_.pdf",
    "Physics.Grade.11.Unit.07.Fluid.Dynamics_.pdf",
    "Physics.Grade.11.Unit.08.Electric.Fields.part1_.pdf",
    "Physics.Grade.11.Unit.08.Electric.Fields.part2_.pdf",
    "Physics.Grade.11.Unit.09.Capacitors_.pdf",
    "Physics.Grade.11.Unit.10.D.C.Circuits_.pdf",
    "Physics.Grade.11.Unit.11.Oscillations_.pdf",
    "Physics.Grade.11.Unit.12.Acoustics_.pdf",
    "Physics.Grade.11.Unit.13.Physical.Optics_.pdf",
    "Physics.Grade.11.Unit.14.Communication_.pdf",
    // Grade 12
    "Physics.Grade.12.Unit.15.Molecular.Theory.of.Gases_.pdf",
    "Physics.Grade.12.Unit.16.First.Law.of.Thermodynamics_.pdf",
    "Physics.Grade.12.Unit.17.Second.Law.of.Thermodynamics_.pdf",
    "Physics.Grade.12.Unit.18.Magnetic.Fields_.pdf",
    "Physics.Grade.12.Unit.19.Electromagnetic.Induction_.pdf",
    "Physics.Grade.12.Unit.20.Alternating.Current_.pdf",
    "Physics.Grade.12.Unit.21.Physics.of.Solids_.pdf",
    "Physics.Grade.12.Unit.22.Solid.State.of.Electronics.part1_.pdf",
    "Physics.Grade.12.Unit.22.Solid.State.of.Electronics.part2_.pdf",
    "Physics.Grade.12.Unit.23.Digital.Electronics_.pdf",
    "Physics.Grade.12.Unit.24.Relativity_.pdf",
    "Physics.Grade.12.Unit.25.Quantum.Physics_.pdf",
    "Physics.Grade.12.Unit.26.Atomic.Physics_.pdf",
    "Physics.Grade.12.Unit.27.Nuclear.Physics_.pdf",
    "Physics.Grade.12.Unit.28.Particles.Physics_.pdf",
];

export const getRemotePdfs = (): RemotePdf[] => {
    return fileNames.map(name => {
        const gradeMatch = name.match(/Grade\.(\d+)/);
        const unitMatch = name.match(/Unit\.(\d+)/);
        if (gradeMatch && unitMatch) {
            const originalUrl = `${BASE_URL}${name}`;
            // We now return the clean URL. Proxying is handled in the fetch logic in App.tsx
            // to allow for failover strategies.
            
            return {
                name,
                grade: `Grade ${gradeMatch[1]}`,
                unit: unitMatch[1],
                url: originalUrl
            };
        }
        return null;
    }).filter((pdf): pdf is RemotePdf => pdf !== null);
};
