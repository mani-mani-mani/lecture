package object;

import contract.*;
import java.awt.geom.Point2D;

import java.util.ArrayList;
import java.util.List;

/**
 * Bezier doing nothing (set as default)
 */
public class NullBezier implements Bezier {
    public List<Point2D> execute(List<Point2D> controlPoints, int numberOfPoints) {
        return controlPoints;
    }
}