# SWAN-SF Dataset Setup & Directory Layout

## 1. Overview
The Space Weather ANalytics for Solar Flares (SWAN-SF) benchmark contains photospheric magnetic vector measurements extracted from the Solar Dynamics Observatory (SDO) Helioseismic and Magnetic Imager (HMI).

## 2. Directory Structure
Ensure files are located in `data/swan/`:
```
data/swan/
├── metadata.json                     # JSON metadata specifying features, sequence dimensions, and partition shapes
├── SWANSF_train_continuous.npy       # Shape: (4800, 24) float32 - normal continuous training stream
├── SWANSF_test_continuous.npy        # Shape: (2400, 24) float32 - continuous evaluation stream
├── SWANSF_test_label_continuous.npy  # Shape: (2400,) int32 - ground truth binary anomaly labels
├── X_train.npy                       # Shape: (80, 60, 24) float32 - 80 training sequences
├── y_train.npy                       # Shape: (80,) int32 - normal sequence labels (zeros)
├── X_val.npy                         # Shape: (30, 60, 24) float32 - 30 validation sequences
├── y_val.npy                         # Shape: (30,) int32 - validation labels (zeros)
├── X_test.npy                        # Shape: (40, 60, 24) float32 - 40 evaluation sequences
├── y_test.npy                        # Shape: (40,) int32 - test sequence labels (14 flares, 26 quiet)
├── train_meta.csv                    # Metadata table for training regions
├── val_meta.csv                      # Metadata table for validation regions
└── test_meta.csv                     # Metadata table with sample_id, active_region_id, flare_class
```

## 3. Physical Feature Schema (24 Channels)
1. **USFLUX**: Total unsigned flux (Maxwell)
2. **TOTUSJH**: Total unsigned vertical current helicity ($G^2/m$)
3. **TOTPOT**: Total photospheric magnetic free energy density ($erg/cm^3$)
4. **TOTUSJX**: Total unsigned vertical current ($A$)
5. **ABSNJ_ZH**: Absolute value of the net non-potential helicity
6. **SAVNCPP**: Sum of the absolute value of net current per polarity ($A$)
7. **AREA_ACR**: Area of active region pixels ($micro-hemispheres$)
8. **MEANPOT**: Mean photospheric magnetic free energy
9. **R_VALUE**: Total unsigned flux near polarity inversion lines
10. **ABSNJ_ZY**: Absolute vertical current component
11. **MEANJ_ZH**: Mean net current helicity
12. **MEANSHR**: Mean shear angle ($degrees$)
13. **MEANALP**: Mean twist parameter $\alpha$ ($1/Mm$)
14. **MEANGAM**: Mean angle of field vector with radial ($degrees$)
15. **MEANGBZ**: Mean gradient of total magnetic field
16. **MEANGBT**: Mean gradient of horizontal magnetic field
17. **MEANGBH**: Mean gradient of vertical magnetic field
18. **MEANJ_ZY**: Mean horizontal electric current
19. **SHRGT45**: Area with shear angle $> 45^{\circ}$
20. **USFLUX_L**: Total unsigned flux logarithm
21. **EPSX**: Normalized Poynting flux $x$-component
22. **EPSY**: Normalized Poynting flux $y$-component
23. **EPSZ**: Normalized Poynting flux $z$-component
24. **R_VALUE_L**: Logarithmic polarity inversion line flux
