package contract;

import java.awt.geom.*;
import java.util.List;

public interface Bezier {
    public List<Point2D> execute(List<Point2D> controPoints, int numberOfPoints);
}